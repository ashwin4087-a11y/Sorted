from sqlalchemy.orm import Session
from app.models import Citizen, Scheme

class DocumentRequirementService:
    def __init__(self, db: Session):
        self.db = db

    def get_required_documents(self, citizen_id: str, scheme_id: str) -> list[dict]:
        citizen = self.db.query(Citizen).filter(Citizen.id == citizen_id).first()
        scheme = self.db.query(Scheme).filter(Scheme.id == scheme_id).first()
        
        if not citizen or not scheme:
            raise ValueError("Citizen or Scheme not found")

        required = []
        
        # Identity is always required
        required.append({
            "document_type": "Identity",
            "reason": "Basic identity verification is always required.",
            "is_verified": citizen.is_verified
        })

        eligibility_text = str(scheme.eligibility).lower() + " " + str(scheme.eligibility_general).lower()

        # Age/DOB verification
        if "age" in eligibility_text or "years" in eligibility_text:
            verified_age = any(a.attribute_name == "age" and a.status == "VERIFIED" for a in citizen.profile_attributes)
            required.append({
                "document_type": "BirthCertificate",
                "reason": "Age verification is required for this scheme.",
                "is_verified": verified_age
            })
            
        # Income verification
        if "income" in eligibility_text or "lakhs" in eligibility_text:
            verified_income = any(a.attribute_name == "income" and a.status == "VERIFIED" for a in citizen.profile_attributes)
            required.append({
                "document_type": "IncomeCertificate",
                "reason": "Income verification is required for this scheme.",
                "is_verified": verified_income
            })

        return required
