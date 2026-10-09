from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class SchemeSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    scheme_code: str
    name: str
    level: str | None
    state: str | None
    ministry: str | None
    category: str | None
    application_mode: str | None
    tags: list | None
    source: str | None


class SchemeDetail(SchemeSummary):
    description: str | None
    eligibility_general: str | None
    eligibility: dict | list | str | None
    exclusions: dict | list | str | None
    benefits: dict | list | str | None
    required_documents: list | dict | str | None
    application_process: list | dict | str | None
    faqs: list | dict | str | None
    official_url: str | None
    myscheme_url: str | None
    last_verified: datetime | None
    created_at: datetime


class SchemePage(BaseModel):
    items: list[SchemeSummary]
    page: int
    limit: int
    total: int
    pages: int
