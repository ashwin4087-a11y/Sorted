import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Any

from sqlalchemy.orm import Session

from app.models import DigiLockerSession, ProfileAttribute, DocumentVerification, Citizen
from app.services.digilocker.provider import DigiLockerProvider
from app.services.digilocker.mock_provider import MockDigiLockerProvider

class DigiLockerService:
    def __init__(self, provider: DigiLockerProvider = None):
        self.provider = provider or MockDigiLockerProvider()

    def create_authorization_request(self, db: Session, citizen_id: uuid.UUID) -> dict:
        state = str(uuid.uuid4())
        session = DigiLockerSession(
            citizen_id=citizen_id,
            state=state,
            status="started",
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=30)
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
        url = f"https://mock-digilocker.gov.in/oauth2/authorize?response_type=code&client_id=MOCK&state={state}"
        return {"auth_url": url, "state": state}

    def process_callback(self, db: Session, state: str, code: str) -> dict:
        session = db.query(DigiLockerSession).filter(DigiLockerSession.state == state).first()
        if not session or session.status != "started":
            raise ValueError("Invalid or expired session")
        
        # Use timezone.utc explicitly instead of utcnow()
        now = datetime.now(timezone.utc)
        
        if session.expires_at.replace(tzinfo=timezone.utc) < now:
            session.status = "expired"
            db.commit()
            raise ValueError("Session expired")
            
        session.status = "completed"
        
        digilocker_id = "mock_dl_" + str(uuid.uuid4())[:8]
        profile_data = self.provider.get_citizen_profile(digilocker_id)
        
        citizen = db.query(Citizen).filter(Citizen.id == session.citizen_id).first()
        citizen.digilocker_id = digilocker_id
        citizen.is_verified = True
        citizen.verification_source = "DIGILOCKER"
        
        self._save_verified_attribute(db, citizen.id, "name", profile_data.get("name", citizen.name))
        self._save_verified_attribute(db, citizen.id, "state", profile_data.get("state", citizen.state))
        self._save_verified_attribute(db, citizen.id, "district", profile_data.get("district", citizen.district))
        db.commit()
        
        return {"status": "success", "digilocker_id": digilocker_id}

    def _save_verified_attribute(self, db: Session, citizen_id: uuid.UUID, attr_name: str, attr_value: str):
        if not attr_value:
            return
        attr = db.query(ProfileAttribute).filter(
            ProfileAttribute.citizen_id == citizen_id,
            ProfileAttribute.attribute_name == attr_name
        ).first()
        if not attr:
            attr = ProfileAttribute(citizen_id=citizen_id, attribute_name=attr_name)
            db.add(attr)
        attr.attribute_value = str(attr_value)
        attr.source = "DIGILOCKER"
        attr.status = "VERIFIED"
        attr.verified_at = datetime.now(timezone.utc)

    def verify_document(self, db: Session, citizen_id: uuid.UUID, document_type: str, document_number: str) -> dict:
        result = self.provider.verify_document(document_type, document_number)
        
        verif = DocumentVerification(
            citizen_id=citizen_id,
            provider="DIGILOCKER",
            document_type=document_type,
            verification_status="VERIFIED" if result.get("verified") else "FAILED",
            verified_fields=result,
            verified_at=datetime.now(timezone.utc) if result.get("verified") else None,
            failure_reason=None if result.get("verified") else "Verification failed"
        )
        db.add(verif)
        db.commit()
        return result
