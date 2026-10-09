from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Application, Citizen, Scheme
from app.schemas.common import ApplicationCreate, ApplicationRead

router = APIRouter(prefix="/applications", tags=["applications"])


@router.post("", response_model=ApplicationRead, status_code=status.HTTP_201_CREATED)
def create_application(payload: ApplicationCreate, db: Session = Depends(get_db)) -> Application:
    if db.get(Citizen, payload.citizen_id) is None:
        raise HTTPException(status_code=404, detail="Citizen not found")
    if db.get(Scheme, payload.scheme_id) is None:
        raise HTTPException(status_code=404, detail="Scheme not found")
    application = Application(**payload.model_dump())
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@router.get("", response_model=list[ApplicationRead])
def list_applications(db: Session = Depends(get_db)) -> list[Application]:
    return list(db.scalars(select(Application).order_by(Application.created_at.desc())).all())


@router.get("/{application_id}", response_model=ApplicationRead)
def get_application(application_id: UUID, db: Session = Depends(get_db)) -> Application:
    application = db.get(Application, application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return application
