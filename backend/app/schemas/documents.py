from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ExtractedField(BaseModel):
    field: str
    value: str
    confidence: float


class DocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    citizen_id: UUID
    application_id: UUID | None
    document_type: str
    document_number: str | None
    holder_name: str | None
    date_of_birth: date | None
    address: str | None
    issue_date: date | None
    expiry_date: date | None
    file_path: str | None
    original_filename: str | None
    mime_type: str | None
    document_purpose: str | None
    file_size: int | None
    verification_status: str
    encryption_version: str | None
    encrypted: bool
    processing_status: str | None
    extraction_confidence: float | None
    extracted_fields: list[ExtractedField] | None
    processed_at: datetime | None
    deleted_at: datetime | None
    expires_at: datetime | None
    created_at: datetime

