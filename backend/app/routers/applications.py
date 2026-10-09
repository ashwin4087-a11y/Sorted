from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Application, Citizen, Scheme, Operator
from app.schemas.common import ApplicationCreate, ApplicationRead
from app.routers.auth import get_current_operator
from app.services.scheme_matcher import SchemeMatcher

router = APIRouter(prefix="/applications", tags=["applications"])


@router.post("", response_model=ApplicationRead, status_code=status.HTTP_201_CREATED)
def create_application(
    payload: ApplicationCreate, 
    db: Session = Depends(get_db),
    operator: Operator = Depends(get_current_operator)
) -> Application:
    citizen = db.get(Citizen, payload.citizen_id)
    if citizen is None or citizen.operator_id != operator.id:
        raise HTTPException(status_code=404, detail="Citizen not found")
        
    scheme = db.get(Scheme, payload.scheme_id)
    if scheme is None:
        raise HTTPException(status_code=404, detail="Scheme not found")
        
    # Eligibility check using SchemeMatcher
    matcher = SchemeMatcher(db)
    result = matcher.evaluate_eligibility(str(citizen.id), str(scheme.id))
    
    if result.status == "NEEDS_VERIFICATION":
        raise HTTPException(status_code=409, detail="Additional verification is required before applying.")
    elif result.status == "NOT_ELIGIBLE":
        raise HTTPException(status_code=403, detail="You cannot apply to this scheme because the current verified profile does not satisfy the required eligibility conditions.")

    application = Application(**payload.model_dump())
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@router.get("", response_model=list[ApplicationRead])
def list_applications(
    db: Session = Depends(get_db),
    operator: Operator = Depends(get_current_operator)
) -> list[Application]:
    return list(db.scalars(
        select(Application)
        .join(Citizen)
        .where(Citizen.operator_id == operator.id)
        .order_by(Application.created_at.desc())
    ).all())


@router.get("/{application_id}", response_model=ApplicationRead)
def get_application(
    application_id: UUID, 
    db: Session = Depends(get_db),
    operator: Operator = Depends(get_current_operator)
) -> Application:
    application = db.get(Application, application_id)
    if application is None or application.citizen.operator_id != operator.id:
        raise HTTPException(status_code=404, detail="Application not found")
    return application
