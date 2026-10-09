from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class DiagnosisStart(BaseModel):
    citizen_id: UUID
    application_id: UUID | None = None
    reported_problem: str | None = None


class DiagnosisAnswer(BaseModel):
    question: str
    answer: str = Field(pattern="^(yes|no|unknown)$")


class DiagnosisResponse(BaseModel):
    case_id: UUID
    status: str
    step: int
    total_steps: int
    question: str | None
    guidance: str | None
    diagnosis: str | None
    failure_code: str | None
    confidence: float | None
    reason: str | None
    remedy: str | None
    next_action: str | None
    required_documents: list[str]
    escalation: str | None
    source_reference: str | None
    created_at: datetime
