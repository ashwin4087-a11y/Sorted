import json
import re
from pathlib import Path

from app.models import Diagnosis, PaymentCase

RULES_PATH = Path(__file__).resolve().parents[1] / "rules" / "dbt_failure_rules.json"
QUESTIONS = [
    ("payment_approved", "Was the payment approved?"),
    ("payment_received", "Has the payment reached your bank account?"),
    ("payment_released", "Were you told that the payment was released?"),
    ("account_active", "Is the bank account currently active?"),
    ("seeded", "Do you know whether Aadhaar is seeded to the DBT bank account?"),
    ("account_valid", "Are the bank account details on the application correct?"),
    ("name_matches", "Does the name match across your identity and bank records?"),
    ("duplicate", "Were you told that a duplicate beneficiary record exists?"),
    ("payment_rejected", "Were you told that the payment was rejected?"),
]


def load_rules() -> dict:
    return json.loads(RULES_PATH.read_text(encoding="utf-8"))


def next_question(answers: dict) -> tuple[int, str | None, str | None]:
    for index, (key, question) in enumerate(QUESTIONS):
        if key not in answers:
            return index + 1, key, question
    return len(QUESTIONS), None, None


def _create_diagnosis(case: PaymentCase, failure_code: str, db, confidence: float) -> Diagnosis:
    rule = load_rules()[failure_code]
    diagnosis = Diagnosis(
        payment_case_id=case.id,
        failure_code=failure_code,
        root_cause=rule.get("user_facing_reason", ""),
        confidence=confidence,
        remedy=rule.get("remedy", ""),
        next_action=rule.get("citizen_action", ""),
        required_documents=rule.get("required_documents", []),
        escalation=rule.get("escalation", ""),
        source_reference=rule.get("source_reference", ""),
    )
    db.add(diagnosis)
    case.payment_status = "diagnosed"
    return diagnosis


def fast_path_diagnosis(reported_problem: str | None, case: PaymentCase, db) -> Diagnosis | None:
    if not reported_problem:
        return None
    rules = load_rules()
    
    # 1. Direct PFMS code match
    code_match = re.search(r'\b([VP]-[AU]\d+)\b', reported_problem, re.IGNORECASE)
    if code_match:
        code = code_match.group(1).upper()
        if code in rules:
            return _create_diagnosis(case, code, db, 0.95)
            
    # 2. Keyword match (from diagnoser.ts)
    text = reported_problem.lower()
    if "aadhaar not seeded" in text or "not seeded" in text:
        return _create_diagnosis(case, "P-U1", db, 0.8) if "P-U1" in rules else _create_diagnosis(case, "AADHAAR_NOT_SEEDED", db, 0.8)
    if "disabled for dbt" in text or "dbt disabled" in text:
        return _create_diagnosis(case, "P-U3", db, 0.8) if "P-U3" in rules else None
    if "account closed" in text:
        return _create_diagnosis(case, "P-A7", db, 0.8) if "P-A7" in rules else None
    if "invalid ifsc" in text:
        return _create_diagnosis(case, "V-A2", db, 0.8) if "V-A2" in rules else None
    if "account blocked" in text or "blocked account" in text:
        return _create_diagnosis(case, "V-A5", db, 0.8) if "V-A5" in rules else None
        
    return None


def choose_failure(answers: dict) -> str | None:
    if answers.get("payment_approved") == "no":
        return "PAYMENT_NOT_RELEASED"
    if answers.get("payment_approved") != "yes":
        return None
    if answers.get("payment_received") == "yes":
        return "UNKNOWN_PAYMENT_FAILURE"
    if answers.get("payment_received") != "no":
        return None
    if answers.get("payment_released") == "no":
        return "PAYMENT_NOT_RELEASED"
    if answers.get("payment_released") != "yes":
        return None
    if answers.get("account_active") == "no":
        return "BANK_ACCOUNT_INACTIVE"
    if answers.get("account_active") != "yes":
        return None
    if answers.get("seeded") == "no":
        return "AADHAAR_NOT_SEEDED"
    if answers.get("seeded") != "yes":
        return None
    if answers.get("account_valid") == "no":
        return "BANK_ACCOUNT_INVALID"
    if answers.get("account_valid") != "yes":
        return None
    if answers.get("name_matches") == "no":
        return "NAME_MISMATCH"
    if answers.get("name_matches") != "yes":
        return None
    if answers.get("duplicate") == "yes":
        return "DUPLICATE_BENEFICIARY"
    if answers.get("duplicate") != "no":
        return None
    if answers.get("payment_rejected") == "yes":
        return "PAYMENT_REJECTED"
    if answers.get("payment_rejected") == "no":
        return "UNKNOWN_PAYMENT_FAILURE"
    return None


def diagnosis_payload(case: PaymentCase, diagnosis: Diagnosis | None, question: str | None, guidance: str | None, step: int) -> dict:
    rule = load_rules().get(diagnosis.failure_code, {}) if diagnosis else {}
    return {
        "case_id": case.id,
        "status": "diagnosed" if diagnosis else "in_progress",
        "step": step,
        "total_steps": len(QUESTIONS),
        "question": question,
        "guidance": guidance,
        "diagnosis": rule.get("user_facing_reason") if diagnosis else None,
        "failure_code": diagnosis.failure_code if diagnosis else None,
        "confidence": diagnosis.confidence if diagnosis else None,
        "reason": diagnosis.root_cause if diagnosis else None,
        "remedy": diagnosis.remedy if diagnosis else None,
        "next_action": diagnosis.next_action if diagnosis else None,
        "required_documents": diagnosis.required_documents or [] if diagnosis else [],
        "escalation": diagnosis.escalation if diagnosis else None,
        "source_reference": diagnosis.source_reference if diagnosis else None,
        "created_at": case.created_at,
    }


def apply_diagnosis(case: PaymentCase, db) -> Diagnosis | None:
    failure_code = choose_failure(case.answers or {})
    if failure_code is None and len(case.answers or {}) >= len(QUESTIONS):
        failure_code = "NEEDS_MANUAL_REVIEW" if "unknown" in (case.answers or {}).values() else "UNKNOWN_PAYMENT_FAILURE"
    if failure_code is None:
        return None
    return _create_diagnosis(
        case, 
        failure_code, 
        db, 
        0.9 if "unknown" not in (case.answers or {}).values() else 0.5
    )
