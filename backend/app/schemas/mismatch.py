from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class MismatchPlan(BaseModel):
    mismatch_id: UUID
    application_id: UUID
    status: str
    created_at: datetime
    plan: dict
