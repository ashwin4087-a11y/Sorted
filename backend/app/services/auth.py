"""Authentication primitives: password hashing, signed session tokens and
Google ID-token verification. Uses only stdlib crypto + google-auth."""

import base64
import hashlib
import hmac
import json
import secrets
import time
from functools import lru_cache

from fastapi import HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from app.config import get_settings

PBKDF2_ITERATIONS = 390_000


# ---------------------------------------------------------------- passwords
def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str | None) -> bool:
    if not stored:
        return False
    try:
        _, iterations, salt_hex, digest_hex = stored.split("$")
        digest = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), bytes.fromhex(salt_hex), int(iterations)
        )
        return hmac.compare_digest(digest.hex(), digest_hex)
    except ValueError:
        return False


# ----------------------------------------------------------- session tokens
@lru_cache
def _secret() -> bytes:
    settings = get_settings()
    key = settings.auth_secret_key or settings.document_encryption_key
    if not key:
        raise RuntimeError("AUTH_SECRET_KEY is not configured in backend/.env")
    return key.encode()


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _unb64(data: str) -> bytes:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))


def create_session_token(operator_id: str) -> str:
    ttl = get_settings().auth_token_ttl_hours * 3600
    payload = _b64(json.dumps({"sub": operator_id, "exp": int(time.time()) + ttl}).encode())
    sig = _b64(hmac.new(_secret(), payload.encode(), hashlib.sha256).digest())
    return f"{payload}.{sig}"


def decode_session_token(token: str) -> str:
    unauthorized = HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired session")
    try:
        payload, sig = token.split(".")
    except ValueError:
        raise unauthorized
    expected = _b64(hmac.new(_secret(), payload.encode(), hashlib.sha256).digest())
    if not hmac.compare_digest(sig, expected):
        raise unauthorized
    data = json.loads(_unb64(payload))
    if data.get("exp", 0) < time.time():
        raise unauthorized
    return data["sub"]


# ------------------------------------------------------------ google oauth
def verify_google_credential(credential: str) -> dict:
    """Verify a Google Identity Services ID token (signature, audience, expiry)."""
    client_id = get_settings().google_client_id
    if not client_id:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Google Sign-In is not configured (GOOGLE_CLIENT_ID missing in backend/.env)",
        )
    
    # Local dev bypass
    if get_settings().environment == "development" and credential == "mock_google_token":
        return {
            "email_verified": True, 
            "email": "demo_operator@sorted.gov.in", 
            "name": "Demo Operator"
        }

    try:
        info = google_id_token.verify_oauth2_token(
            credential, google_requests.Request(), client_id
        )
    except ValueError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Invalid Google token: {exc}")
    except Exception as exc:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Google token verification failed: {exc}")
        
    if not info.get("email_verified"):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Google email is not verified")
    return info
