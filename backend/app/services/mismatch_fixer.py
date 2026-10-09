import json
from pathlib import Path

from app.models import Mismatch

RULES_PATH = Path(__file__).resolve().parents[1] / "rules" / "mismatch_rules.json"


def load_rules() -> dict:
    return json.loads(RULES_PATH.read_text(encoding="utf-8"))


def rule_key(mismatch: Mismatch) -> str:
    field = mismatch.field_name.lower()
    if field in {"name", "holder_name"}:
        return "NAME_MISMATCH"
    if field in {"date_of_birth", "dob"}:
        return "DOB_MISMATCH"
    if field in {"address", "state", "district"}:
        return "ADDRESS_MISMATCH"
    recommendation = (mismatch.recommended_action or "").lower()
    if field == "document" and any(token in recommendation for token in ("missing", "upload", "required")):
        return "MISSING_DOCUMENT"
    if field == "expiry_date" or "expired" in (mismatch.recommended_action or "").lower():
        return "EXPIRED_DOCUMENT"
    return "ADDRESS_MISMATCH"


def build_resolution_plan(mismatch: Mismatch) -> dict:
    rule = load_rules().get(rule_key(mismatch), {})
    return {
        "issue": rule.get("issue", "A document value needs review."),
        "likely_source_document": rule.get("likely_source_document", mismatch.source_document),
        "target_document_or_system": rule.get("target_document_or_system", mismatch.conflicting_document),
        "correction_action": rule.get("correction_action", mismatch.recommended_action or "Review the conflicting values."),
        "supporting_documents": rule.get("supporting_documents", []),
        "urgency": rule.get("urgency", "medium"),
        "may_block_application": rule.get("may_block_application", False),
        "escalation_path": rule.get("escalation_path", "Use the official channel for the target document or system."),
        "action_item": rule.get("action_item", None),
        "current_values": {
            "field": mismatch.field_name,
            "document_a": mismatch.source_document,
            "value_a": mismatch.source_value or "UNKNOWN",
            "document_b": mismatch.conflicting_document,
            "value_b": mismatch.conflicting_value or "UNKNOWN",
        },
        "rule": rule_key(mismatch),
    }
