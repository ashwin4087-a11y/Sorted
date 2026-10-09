from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Application, Citizen, Diagnosis, PaymentCase
from app.schemas.payment_diagnosis import DiagnosisAnswer, DiagnosisResponse, DiagnosisStart
from app.services.payment_diagnosis import apply_diagnosis, diagnosis_payload, fast_path_diagnosis, next_question

router = APIRouter(prefix="/api/payment-diagnosis", tags=["payment-diagnosis"])


def get_case(case_id: UUID, db: Session) -> PaymentCase:
    case = db.get(PaymentCase, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Payment case not found")
    return case


@router.post("/start", response_model=DiagnosisResponse)
def start(payload: DiagnosisStart, db: Session = Depends(get_db)) -> dict:
    if db.get(Citizen, payload.citizen_id) is None:
        raise HTTPException(status_code=404, detail="Citizen not found")
    if payload.application_id and db.get(Application, payload.application_id) is None:
        raise HTTPException(status_code=404, detail="Application not found")
    case = PaymentCase(
        citizen_id=payload.citizen_id,
        application_id=payload.application_id,
        payment_status="in_progress",
        reported_problem=payload.reported_problem,
        answers={},
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    
    fast_diagnosis = fast_path_diagnosis(payload.reported_problem, case, db)
    if fast_diagnosis:
        db.commit()
        return diagnosis_payload(case, fast_diagnosis, None, None, 0)
        
    step, question_key, question = next_question({})
    case.current_question = question_key
    db.commit()
    return diagnosis_payload(case, None, question, None, step)


@router.post("/{case_id}/answer", response_model=DiagnosisResponse)
def answer(case_id: UUID, payload: DiagnosisAnswer, db: Session = Depends(get_db)) -> dict:
    case = get_case(case_id, db)
    answers = dict(case.answers or {})
    if case.current_question and payload.question != case.current_question:
        raise HTTPException(status_code=409, detail="Answer the current question before continuing")
    answers[payload.question] = payload.answer
    case.answers = answers
    diagnosis = apply_diagnosis(case, db)
    if diagnosis:
        case.current_question = None
        db.commit()
        return diagnosis_payload(case, diagnosis, None, None, len(answers))
    step, question_key, question = next_question(answers)
    case.current_question = question_key
    guidance = (
        "You selected I don't know. SORTED cannot access bank, Aadhaar, NPCI, or PFMS records. "
        "Check your bank passbook, bank branch, official scheme portal, or request a written status."
        if payload.answer == "unknown" else None
    )
    db.commit()
    return diagnosis_payload(case, None, question, guidance, step)


@router.get("/{case_id}", response_model=DiagnosisResponse)
def read_case(case_id: UUID, db: Session = Depends(get_db)) -> dict:
    case = get_case(case_id, db)
    diagnosis = db.scalar(
        select(Diagnosis).where(Diagnosis.payment_case_id == case.id).order_by(Diagnosis.created_at.desc())
    )
    step, _, question = next_question(case.answers or {})
    return diagnosis_payload(case, diagnosis, None if diagnosis else question, None, step)
