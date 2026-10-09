from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Citizen, ProfileAttribute, Operator, SchemeEligibilityResult
from app.routers.auth import get_current_operator
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/profile", tags=["profile"])

class ProfileAttributeSchema(BaseModel):
    attribute_name: str
    attribute_value: Optional[str] = None
    source: str = "USER_INPUT"
    status: str = "SELF_DECLARED"

class ProfileUpdatePayload(BaseModel):
    citizen_id: UUID
    attributes: List[ProfileAttributeSchema]

@router.get("")
def get_profile(
    citizen_id: UUID,
    db: Session = Depends(get_db),
    operator: Operator = Depends(get_current_operator)
):
    citizen = db.query(Citizen).filter(Citizen.id == citizen_id).first()
    if not citizen or citizen.operator_id != operator.id:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    attrs = {attr.attribute_name: {"value": attr.attribute_value, "status": attr.status, "source": attr.source} for attr in citizen.profile_attributes}
    
    return {
        "citizen": citizen,
        "attributes": attrs
    }

@router.put("")
def update_profile(
    payload: ProfileUpdatePayload,
    db: Session = Depends(get_db),
    operator: Operator = Depends(get_current_operator)
):
    citizen = db.query(Citizen).filter(Citizen.id == payload.citizen_id).first()
    if not citizen or citizen.operator_id != operator.id:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    for item in payload.attributes:
        attr = db.query(ProfileAttribute).filter(
            ProfileAttribute.citizen_id == citizen.id,
            ProfileAttribute.attribute_name == item.attribute_name
        ).first()
        if not attr:
            attr = ProfileAttribute(
                citizen_id=citizen.id, 
                attribute_name=item.attribute_name,
                source=item.source,
                status=item.status
            )
            db.add(attr)
        attr.attribute_value = item.attribute_value
        
        # Invalidate scheme eligibility
        db.query(SchemeEligibilityResult).filter(SchemeEligibilityResult.citizen_id == citizen.id).delete()
        
    db.commit()
    return {"status": "success"}

@router.get("/verification")
def get_profile_verification(
    citizen_id: UUID,
    db: Session = Depends(get_db),
    operator: Operator = Depends(get_current_operator)
):
    citizen = db.query(Citizen).filter(Citizen.id == citizen_id).first()
    if not citizen or citizen.operator_id != operator.id:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    verifs = [{"document_type": v.document_type, "status": v.verification_status, "provider": v.provider} for v in citizen.document_verifications]
    return {
        "is_verified": citizen.is_verified,
        "source": citizen.verification_source,
        "document_verifications": verifs
    }
