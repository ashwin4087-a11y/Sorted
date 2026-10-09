from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class APIModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class CitizenCreate(BaseModel):
    name: str
    phone: str
    language: str = "en"
    state: str
    district: str


class CitizenRead(CitizenCreate, APIModel):
    id: UUID
    created_at: datetime


class SchemeRead(APIModel):
    id: UUID
    scheme_code: str
    name: str
    level: str | None
    ministry: str | None
    description: str | None
    category: str | None
    tags: list | None
    state: str | None
    eligibility: dict | list | None
    benefits: dict | list | None
    required_documents: list | None
    application_process: list | None
    official_url: str | None
    myscheme_url: str | None
    source: str | None
    last_verified: datetime | None
    created_at: datetime


class ApplicationCreate(BaseModel):
    citizen_id: UUID
    scheme_id: UUID
    application_number: str | None = None
    status: str = "draft"


class ApplicationRead(ApplicationCreate, APIModel):
    id: UUID
    submitted_at: datetime | None
    created_at: datetime
    updated_at: datetime
