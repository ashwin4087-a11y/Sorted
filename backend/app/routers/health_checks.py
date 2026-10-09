from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Application, HealthCheck, Mismatch
from app.schemas.health_checks import HealthCheckRead
from app.services.health_check import run_health_check

router = APIRouter(prefix="/api/health-check", tags=["health-check"])


def response(check: HealthCheck) -> HealthCheckRead:
    issues = check.issues_found or []
    return HealthCheckRead(
        id=check.id,
        application_id=check.application_id,
        overall_status=check.overall_status,
        issues_found=issues,
        checked_at=check.checked_at,
        documents_compared=check.documents_compared or [],
    )


@router.post("/{application_id}", response_model=HealthCheckRead)
def create_health_check(application_id: UUID, db: Session = Depends(get_db)) -> HealthCheckRead:
    application = db.scalar(
        select(Application).options(selectinload(Application.documents)).where(Application.id == application_id)
    )
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    status, issues, compared = run_health_check(application)
    check = HealthCheck(application_id=application_id, overall_status=status, issues_found=issues, documents_compared=compared)
    db.add(check)
    for issue in issues:
        db.add(Mismatch(
            application_id=application_id,
            field_name=issue["field"],
            source_document=issue["document_a"],
            conflicting_document=issue["document_b"],
            source_value=issue["value_a"],
            conflicting_value=issue["value_b"],
            severity=issue["severity"],
            recommended_action=issue["recommended_action"],
        ))
    db.commit()
    db.refresh(check)
    return response(check)


@router.get("/{application_id}", response_model=HealthCheckRead)
def get_health_check(application_id: UUID, db: Session = Depends(get_db)) -> HealthCheckRead:
    check = db.scalar(
        select(HealthCheck).where(HealthCheck.application_id == application_id).order_by(HealthCheck.checked_at.desc())
    )
    if check is None:
        raise HTTPException(status_code=404, detail="Health check not found")
    return response(check)
