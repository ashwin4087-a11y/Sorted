from typing import Dict, Any
from app.services.digilocker.provider import DigiLockerProvider
import uuid

class MockDigiLockerProvider(DigiLockerProvider):
    def verify_document(self, document_type: str, document_id: str) -> dict[str, Any]:
        return {
            "verified": True,
            "document_type": document_type,
            "document_id": document_id,
            "issuer": "Mock Issuer Authority"
        }

    def get_citizen_profile(self, digilocker_id: str) -> dict[str, Any]:
        return {
            "digilocker_id": digilocker_id,
            "name": "Verified Mock User",
            "phone": "9999999999",
            "state": "Maharashtra",
            "district": "Mumbai",
            "language": "en",
            "verification_source": "DigiLocker (Mock)"
        }
