from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class HealthCheckRead(BaseModel):
    id: UUID
    application_id: UUID
    overall_status: str
    issues_found: list[dict]
    checked_at: datetime
    documents_compared: list[str] = []
