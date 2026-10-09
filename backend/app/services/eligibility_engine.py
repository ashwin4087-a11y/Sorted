import json
from typing import Tuple
from app.models import Citizen, Scheme

class EligibilityEngine:
    @staticmethod
    def evaluate(citizen: Citizen, scheme: Scheme) -> Tuple[bool, str]:
        """
        Evaluate if a citizen is eligible for a given scheme.
        Returns (is_eligible, reason)
        """
        if not citizen.is_verified:
            return False, "Citizen must be verified (e.g. via DigiLocker) before applying."
        
        # In a real-world scenario, this would parse the `scheme.eligibility` JSON 
        # and match it against `citizen.profile_data`.
        # For now, we perform some basic sanity checks if available.
        profile = citizen.profile_data or {}
        
        # If the scheme has a specific state requirement, check it
        scheme_state = scheme.state
        if scheme_state and scheme_state.lower() not in ["all india", "central"]:
            citizen_state = profile.get("state") or citizen.state
            if citizen_state and citizen_state.lower() != scheme_state.lower():
                return False, f"Citizen state ({citizen_state}) does not match scheme state ({scheme_state})."

        # Additional basic rules can be added here
        
        return True, "Citizen meets basic eligibility criteria."
