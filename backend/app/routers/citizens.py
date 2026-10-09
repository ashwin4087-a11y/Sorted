from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Citizen
from app.schemas.common import CitizenCreate, CitizenRead

router = APIRouter(prefix="/citizens", tags=["citizens"])


@router.post("", response_model=CitizenRead, status_code=status.HTTP_201_CREATED)
def create_citizen(payload: CitizenCreate, db: Session = Depends(get_db)) -> Citizen:
    citizen = Citizen(**payload.model_dump())
    db.add(citizen)
    db.commit()
    db.refresh(citizen)
    return citizen


@router.get("", response_model=list[CitizenRead])
def list_citizens(db: Session = Depends(get_db)) -> list[Citizen]:
    return list(db.scalars(select(Citizen).order_by(Citizen.created_at.desc())).all())


@router.get("/{citizen_id}", response_model=CitizenRead)
def get_citizen(citizen_id: UUID, db: Session = Depends(get_db)) -> Citizen:
    citizen = db.get(Citizen, citizen_id)
    if citizen is None:
        raise HTTPException(status_code=404, detail="Citizen not found")
    return citizen
