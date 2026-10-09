from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Citizen, Operator
from app.schemas.common import CitizenCreate, CitizenRead
from app.routers.auth import get_current_operator
from app.services.digilocker import get_digilocker_provider

router = APIRouter(prefix="/api/citizens", tags=["citizens"])


@router.post("", response_model=CitizenRead, status_code=status.HTTP_201_CREATED)
def create_citizen(
    payload: CitizenCreate, 
    db: Session = Depends(get_db),
    operator: Operator = Depends(get_current_operator)
) -> Citizen:
    citizen = Citizen(**payload.model_dump(), operator_id=operator.id)
    db.add(citizen)
    db.commit()
    db.refresh(citizen)
    return citizen


@router.get("", response_model=list[CitizenRead])
def list_citizens(
    db: Session = Depends(get_db),
    operator: Operator = Depends(get_current_operator)
) -> list[Citizen]:
    return list(db.scalars(
        select(Citizen)
        .where(Citizen.operator_id == operator.id)
        .order_by(Citizen.created_at.desc())
    ).all())


@router.get("/{citizen_id}", response_model=CitizenRead)
def get_citizen(
    citizen_id: UUID, 
    db: Session = Depends(get_db),
    operator: Operator = Depends(get_current_operator)
) -> Citizen:
    citizen = db.get(Citizen, citizen_id)
    if citizen is None or citizen.operator_id != operator.id:
        raise HTTPException(status_code=404, detail="Citizen not found")
    return citizen

from pydantic import BaseModel
class VerifyDigiLockerRequest(BaseModel):
    digilocker_id: str

@router.post("/{citizen_id}/verify/digilocker", response_model=CitizenRead)
def verify_digilocker(
    citizen_id: UUID,
    payload: VerifyDigiLockerRequest,
    db: Session = Depends(get_db),
    operator: Operator = Depends(get_current_operator)
) -> Citizen:
    citizen = db.get(Citizen, citizen_id)
    if citizen is None or citizen.operator_id != operator.id:
        raise HTTPException(status_code=404, detail="Citizen not found")
    
    provider = get_digilocker_provider()
    try:
        profile_data = provider.get_citizen_profile(payload.digilocker_id)
        citizen.is_verified = True
        citizen.verification_source = profile_data.get("verification_source", "DigiLocker")
        citizen.digilocker_id = payload.digilocker_id
        citizen.profile_data = profile_data
        
        # Optionally update name/phone from verified profile
        if profile_data.get("name"):
            citizen.name = profile_data["name"]
        
        db.commit()
        db.refresh(citizen)
        return citizen
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"DigiLocker verification failed: {str(e)}")
