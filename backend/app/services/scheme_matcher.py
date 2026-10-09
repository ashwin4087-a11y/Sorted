import re
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from app.models import Citizen, Scheme, ProfileAttribute, SchemeEligibilityResult

class SchemeMatcher:
    def __init__(self, db: Session):
        self.db = db

    def evaluate_eligibility(self, citizen_id: str, scheme_id: str) -> SchemeEligibilityResult:
        citizen = self.db.query(Citizen).filter(Citizen.id == citizen_id).first()
        scheme = self.db.query(Scheme).filter(Scheme.id == scheme_id).first()
        
        if not citizen or not scheme:
            raise ValueError("Citizen or Scheme not found")

        # Load attributes into a dict
        attributes = {attr.attribute_name: attr for attr in citizen.profile_attributes}
        
        # Evaluate
        status = "ELIGIBLE"
        match_score = "Strong Match"
        reasons = []
        missing = []
        
        # Basic state matching
        scheme_state = scheme.state
        if scheme_state and scheme_state.lower() not in ["all india", "central"]:
            c_state_attr = attributes.get("state")
            c_state = c_state_attr.attribute_value if c_state_attr else citizen.state
            if not c_state:
                status = "NEEDS_VERIFICATION"
                missing.append("state")
            elif c_state.lower() != scheme_state.lower():
                return self._reject(citizen.id, scheme.id, f"Scheme requires state {scheme_state}, but your state is {c_state}")
            else:
                reasons.append("State requirement satisfied")
                
        # Basic gender matching (heuristic)
        eligibility_text = str(scheme.eligibility).lower() + " " + str(scheme.eligibility_general).lower()
        if "women" in eligibility_text or "girl" in eligibility_text or "female" in eligibility_text:
            if "men" not in eligibility_text and "boy" not in eligibility_text and "male" not in eligibility_text:
                gender_attr = attributes.get("gender")
                if not gender_attr or not gender_attr.attribute_value:
                    status = "NEEDS_VERIFICATION"
                    missing.append("gender")
                elif gender_attr.attribute_value.lower() != "female":
                    return self._reject(citizen.id, scheme.id, "Scheme is primarily for women/girls.")
                else:
                    reasons.append("Gender requirement satisfied")

        # Basic age matching (heuristic)
        if "years" in eligibility_text or "age" in eligibility_text:
            age_attr = attributes.get("age")
            if not age_attr or not age_attr.attribute_value:
                # Can't reliably evaluate age without it, if there's a strong age condition
                if "above 60" in eligibility_text or "senior citizen" in eligibility_text:
                    status = "NEEDS_VERIFICATION"
                    missing.append("age")
            else:
                try:
                    age = int(age_attr.attribute_value)
                    if ("above 60" in eligibility_text or "senior citizen" in eligibility_text) and age < 60:
                        return self._reject(citizen.id, scheme.id, f"Applicant must be 60 years or older. Your age: {age}")
                    reasons.append("Age requirement satisfied")
                except ValueError:
                    pass

        if "student" in eligibility_text or "scholarship" in eligibility_text or "education" in eligibility_text:
            student_attr = attributes.get("student")
            if not student_attr or not student_attr.attribute_value:
                status = "NEEDS_VERIFICATION"
                missing.append("student_status")
            elif student_attr.attribute_value.lower() not in ["yes", "true"]:
                return self._reject(citizen.id, scheme.id, "Scheme requires student status.")
            else:
                reasons.append("Student requirement satisfied")

        if not missing and not reasons:
            reasons.append("General criteria satisfied")
            status = "LIKELY_ELIGIBLE"
            match_score = "Likely Match"
            
        if missing:
            status = "NEEDS_VERIFICATION"
            match_score = "Needs Verification"

        result = self.db.query(SchemeEligibilityResult).filter(
            SchemeEligibilityResult.citizen_id == citizen.id,
            SchemeEligibilityResult.scheme_id == scheme.id
        ).first()
        
        if not result:
            result = SchemeEligibilityResult(citizen_id=citizen.id, scheme_id=scheme.id)
            self.db.add(result)
            
        result.status = status
        result.match_score = match_score
        result.reasons = reasons
        result.missing_information = missing
        
        self.db.commit()
        self.db.refresh(result)
        return result

    def _reject(self, citizen_id, scheme_id, reason) -> SchemeEligibilityResult:
        result = self.db.query(SchemeEligibilityResult).filter(
            SchemeEligibilityResult.citizen_id == citizen_id,
            SchemeEligibilityResult.scheme_id == scheme_id
        ).first()
        if not result:
            result = SchemeEligibilityResult(citizen_id=citizen_id, scheme_id=scheme_id)
            self.db.add(result)
            
        result.status = "NOT_ELIGIBLE"
        result.match_score = "Not Eligible"
        result.reasons = [reason]
        result.missing_information = []
        self.db.commit()
        self.db.refresh(result)
        return result

