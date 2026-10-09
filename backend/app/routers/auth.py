from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models.entities import AuditLog, Operator
from app.services.auth import (
    create_session_token,
    decode_session_token,
    hash_password,
    verify_google_credential,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ------------------------------------------------------------------ schemas
class GoogleCredentialPayload(BaseModel):
    credential: str = Field(min_length=20)


class SignupPayload(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


class OperatorRead(BaseModel):
    id: UUID
    name: str
    email: str
    picture_url: Optional[str] = None
    auth_provider: str

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    token: str
    operator: OperatorRead


class AuthConfig(BaseModel):
    google_client_id: str


# ------------------------------------------------------------------ helpers
def _audit(db: Session, operator: Operator, action: str) -> None:
    db.add(
        AuditLog(
            actor=f"operator:{operator.email}",
            action=action,
            purpose="authentication",
            metadata_info={"operator_id": str(operator.id), "provider": operator.auth_provider},
        )
    )


def _issue(db: Session, operator: Operator, action: str) -> AuthResponse:
    operator.last_login_at = datetime.now(timezone.utc)
    _audit(db, operator, action)
    db.commit()
    db.refresh(operator)
    return AuthResponse(token=create_session_token(str(operator.id)), operator=operator)


def get_current_operator(
    authorization: str | None = Header(default=None), db: Session = Depends(get_db)
) -> Operator:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    operator_id = decode_session_token(authorization.split(" ", 1)[1])
    operator = db.get(Operator, UUID(operator_id))
    if not operator:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account no longer exists")
    return operator


# ------------------------------------------------------------------ routes
@router.get("/config", response_model=AuthConfig)
def auth_config() -> AuthConfig:
    """Public: lets the frontend know which Google OAuth client to use."""
    return AuthConfig(google_client_id=get_settings().google_client_id)


@router.post("/google", response_model=AuthResponse)
def google_sign_in(payload: GoogleCredentialPayload, db: Session = Depends(get_db)) -> AuthResponse:
    info = verify_google_credential(payload.credential)  # raises 401 if forged/expired
    email = info["email"].lower()

    operator = db.query(Operator).filter(Operator.google_id == info["sub"]).first()
    if not operator:
        operator = db.query(Operator).filter(Operator.email == email).first()

    if operator:
        operator.google_id = info["sub"]
        operator.name = info.get("name") or operator.name
        operator.picture_url = info.get("picture") or operator.picture_url
        action = "LOGIN_GOOGLE"
    else:
        operator = Operator(
            name=info.get("name") or email.split("@")[0],
            email=email,
            google_id=info["sub"],
            picture_url=info.get("picture"),
            auth_provider="google",
        )
        db.add(operator)
        db.flush()
        action = "SIGNUP_GOOGLE"
    return _issue(db, operator, action)


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupPayload, db: Session = Depends(get_db)) -> AuthResponse:
    email = payload.email.lower()
    if db.query(Operator).filter(Operator.email == email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists. Please log in.")
    operator = Operator(
        name=payload.name.strip(),
        email=email,
        password_hash=hash_password(payload.password),
        auth_provider="password",
    )
    db.add(operator)
    db.flush()
    return _issue(db, operator, "SIGNUP_PASSWORD")


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginPayload, db: Session = Depends(get_db)) -> AuthResponse:
    operator = db.query(Operator).filter(Operator.email == payload.email.lower()).first()
    if not operator or not verify_password(payload.password, operator.password_hash):
        if operator and not operator.password_hash:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "This account uses Google Sign-In. Please continue with Google.")
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    return _issue(db, operator, "LOGIN_PASSWORD")


@router.get("/me", response_model=OperatorRead)
def me(operator: Operator = Depends(get_current_operator)) -> Operator:
    return operator
