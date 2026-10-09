import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.digilocker.service import DigiLockerService
from app.routers.auth import get_current_user
from app.models import Operator

router = APIRouter(prefix="/api/digilocker", tags=["digilocker"])
digilocker_service = DigiLockerService()

@router.post("/authorize")
def authorize_digilocker(
    citizen_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Operator = Depends(get_current_user)
):
    """
    Initiates DigiLocker OAuth flow.
    """
    try:
        res = digilocker_service.create_authorization_request(db, citizen_id)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/callback")
def digilocker_callback(
    state: str,
    code: str,
    db: Session = Depends(get_db),
    current_user: Operator = Depends(get_current_user)
):
    """
    Handles DigiLocker OAuth callback.
    """
    try:
        res = digilocker_service.process_callback(db, state, code)
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify-document")
def verify_document(
    citizen_id: uuid.UUID,
    document_type: str,
    document_number: str,
    db: Session = Depends(get_db),
    current_user: Operator = Depends(get_current_user)
):
    try:
        res = digilocker_service.verify_document(db, citizen_id, document_type, document_number)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
