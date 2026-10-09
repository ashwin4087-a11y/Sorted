from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Mismatch
from app.schemas.mismatch import MismatchPlan
from app.services.mismatch_fixer import build_resolution_plan

router = APIRouter(prefix="/api/mismatch", tags=["mismatch"])


def serialize(mismatch: Mismatch) -> MismatchPlan:
    return MismatchPlan(
        mismatch_id=mismatch.id,
        application_id=mismatch.application_id,
        status=mismatch.status,
        created_at=mismatch.created_at,
        plan=mismatch.resolution_plan or build_resolution_plan(mismatch),
    )


@router.post("/{mismatch_id}/resolve-plan", response_model=MismatchPlan)
def create_resolution_plan(mismatch_id: UUID, db: Session = Depends(get_db)) -> MismatchPlan:
    mismatch = db.get(Mismatch, mismatch_id)
    if mismatch is None:
        raise HTTPException(status_code=404, detail="Mismatch not found")
    mismatch.resolution_plan = build_resolution_plan(mismatch)
    db.commit()
    db.refresh(mismatch)
    return serialize(mismatch)


@router.get("/{mismatch_id}/resolve-plan", response_model=MismatchPlan)
def get_resolution_plan(mismatch_id: UUID, db: Session = Depends(get_db)) -> MismatchPlan:
    mismatch = db.get(Mismatch, mismatch_id)
    if mismatch is None:
        raise HTTPException(status_code=404, detail="Mismatch not found")
    if mismatch.resolution_plan is None:
        raise HTTPException(status_code=404, detail="Resolution plan not created")
    return serialize(mismatch)
