from datetime import date, datetime
from uuid import UUID

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import UUIDTimestampModel


class Citizen(UUIDTimestampModel):
    __tablename__ = "citizens"

    name: Mapped[str] = mapped_column(String(160), nullable=False)
    phone: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    language: Mapped[str] = mapped_column(String(32), nullable=False, default="en")
    state: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    district: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    operator_id: Mapped[UUID | None] = mapped_column(ForeignKey("operators.id", ondelete="SET NULL"), index=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verification_source: Mapped[str | None] = mapped_column(String(50))
    digilocker_id: Mapped[str | None] = mapped_column(String(100), unique=True, index=True)
    profile_data: Mapped[dict | None] = mapped_column(JSONB)

    operator: Mapped["Operator"] = relationship(back_populates="citizens")
    applications: Mapped[list["Application"]] = relationship(back_populates="citizen")
    documents: Mapped[list["Document"]] = relationship(back_populates="citizen")
    payment_cases: Mapped[list["PaymentCase"]] = relationship(back_populates="citizen")
    actions: Mapped[list["Action"]] = relationship(back_populates="citizen")
    profile_attributes: Mapped[list["ProfileAttribute"]] = relationship(back_populates="citizen")
    document_verifications: Mapped[list["DocumentVerification"]] = relationship(back_populates="citizen")
    eligibility_results: Mapped[list["SchemeEligibilityResult"]] = relationship(back_populates="citizen")

class Operator(UUIDTimestampModel):
    __tablename__ = "operators"

    name: Mapped[str] = mapped_column(String(160), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    google_id: Mapped[str] = mapped_column(String(255), nullable=True, unique=True)
    picture_url: Mapped[str] = mapped_column(String(500), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=True)
    auth_provider: Mapped[str] = mapped_column(String(32), nullable=False, default="google")
    last_login_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    citizens: Mapped[list["Citizen"]] = relationship(back_populates="operator")


class Scheme(UUIDTimestampModel):
    __tablename__ = "schemes"

    scheme_code: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(300), nullable=False, index=True)
    level: Mapped[str | None] = mapped_column(String(100), index=True)
    ministry: Mapped[str | None] = mapped_column(String(300), index=True)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(String(100), index=True)
    tags: Mapped[list | None] = mapped_column(JSONB)
    state: Mapped[str | None] = mapped_column(String(100), index=True)
    application_mode: Mapped[str | None] = mapped_column(String(100), index=True)
    eligibility_general: Mapped[str | None] = mapped_column(Text)
    eligibility: Mapped[dict | list | str | None] = mapped_column(JSONB)
    exclusions: Mapped[dict | list | str | None] = mapped_column(JSONB)
    benefits: Mapped[dict | list | str | None] = mapped_column(JSONB)
    required_documents: Mapped[list | dict | str | None] = mapped_column(JSONB)
    application_process: Mapped[list | dict | str | None] = mapped_column(JSONB)
    faqs: Mapped[list | dict | str | None] = mapped_column(JSONB)
    official_url: Mapped[str | None] = mapped_column(String(500))
    myscheme_url: Mapped[str | None] = mapped_column(String(500))
    source: Mapped[str | None] = mapped_column(String(200))
    last_verified: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    applications: Mapped[list["Application"]] = relationship(back_populates="scheme")


class Application(UUIDTimestampModel):
    __tablename__ = "applications"
    __table_args__ = (Index("ix_applications_citizen_status", "citizen_id", "status"),)

    citizen_id: Mapped[UUID] = mapped_column(ForeignKey("citizens.id", ondelete="CASCADE"), nullable=False, index=True)
    scheme_id: Mapped[UUID] = mapped_column(ForeignKey("schemes.id", ondelete="RESTRICT"), nullable=False, index=True)
    application_number: Mapped[str | None] = mapped_column(String(100), unique=True, index=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="draft", index=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    citizen: Mapped[Citizen] = relationship(back_populates="applications")
    scheme: Mapped[Scheme] = relationship(back_populates="applications")
    documents: Mapped[list["Document"]] = relationship(back_populates="application")
    health_checks: Mapped[list["HealthCheck"]] = relationship(back_populates="application")
    mismatches: Mapped[list["Mismatch"]] = relationship(back_populates="application")
    payment_cases: Mapped[list["PaymentCase"]] = relationship(back_populates="application")
    actions: Mapped[list["Action"]] = relationship(back_populates="application")
    events: Mapped[list["ApplicationEvent"]] = relationship(back_populates="application")


class Document(UUIDTimestampModel):
    __tablename__ = "documents"
    __table_args__ = (Index("ix_documents_application_type", "application_id", "document_type"),)

    citizen_id: Mapped[UUID] = mapped_column(ForeignKey("citizens.id", ondelete="CASCADE"), nullable=False, index=True)
    application_id: Mapped[UUID | None] = mapped_column(ForeignKey("applications.id", ondelete="CASCADE"), index=True)
    document_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    document_number: Mapped[str | None] = mapped_column(String(150), index=True)
    holder_name: Mapped[str | None] = mapped_column(String(160))
    date_of_birth: Mapped[date | None] = mapped_column(Date)
    address: Mapped[str | None] = mapped_column(Text)
    issue_date: Mapped[date | None] = mapped_column(Date)
    expiry_date: Mapped[date | None] = mapped_column(Date)
    file_path: Mapped[str | None] = mapped_column(String(500))
    verification_status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending", index=True)
    extraction_confidence: Mapped[float | None] = mapped_column()
    extracted_fields: Mapped[dict | list | None] = mapped_column(JSONB)
    original_filename: Mapped[str | None] = mapped_column(String(255))
    mime_type: Mapped[str | None] = mapped_column(String(100))
    document_purpose: Mapped[str | None] = mapped_column(String(100), index=True)
    file_size: Mapped[int | None] = mapped_column(Integer)
    storage_key: Mapped[str | None] = mapped_column(String(500))
    sha256_hash: Mapped[str | None] = mapped_column(String(64), index=True)
    encryption_version: Mapped[str | None] = mapped_column(String(20))
    encrypted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    processing_status: Mapped[str | None] = mapped_column(String(50), index=True)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    citizen: Mapped[Citizen] = relationship(back_populates="documents")
    application: Mapped[Application | None] = relationship(back_populates="documents")
    verification: Mapped["DocumentVerification"] = relationship(back_populates="document")


class HealthCheck(UUIDTimestampModel):
    __tablename__ = "health_checks"

    application_id: Mapped[UUID] = mapped_column(ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    overall_status: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    issues_found: Mapped[list | dict | None] = mapped_column(JSONB)
    documents_compared: Mapped[list | None] = mapped_column(JSONB)
    checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    application: Mapped[Application] = relationship(back_populates="health_checks")


class Mismatch(UUIDTimestampModel):
    __tablename__ = "mismatches"

    application_id: Mapped[UUID] = mapped_column(ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    field_name: Mapped[str] = mapped_column(String(100), nullable=False)
    source_document: Mapped[str] = mapped_column(String(100), nullable=False)
    conflicting_document: Mapped[str] = mapped_column(String(100), nullable=False)
    source_value: Mapped[str | None] = mapped_column(Text)
    conflicting_value: Mapped[str | None] = mapped_column(Text)
    severity: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    recommended_action: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="open", index=True)
    resolution_plan: Mapped[dict | None] = mapped_column(JSONB)

    application: Mapped[Application] = relationship(back_populates="mismatches")


class PaymentCase(UUIDTimestampModel):
    __tablename__ = "payment_cases"

    citizen_id: Mapped[UUID] = mapped_column(ForeignKey("citizens.id", ondelete="CASCADE"), nullable=False, index=True)
    application_id: Mapped[UUID | None] = mapped_column(ForeignKey("applications.id", ondelete="SET NULL"), index=True)
    payment_status: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    reported_problem: Mapped[str | None] = mapped_column(Text)
    answers: Mapped[dict | None] = mapped_column(JSONB)
    current_question: Mapped[str | None] = mapped_column(String(100))

    citizen: Mapped[Citizen] = relationship(back_populates="payment_cases")
    application: Mapped[Application | None] = relationship(back_populates="payment_cases")
    diagnoses: Mapped[list["Diagnosis"]] = relationship(back_populates="payment_case")


class Diagnosis(UUIDTimestampModel):
    __tablename__ = "diagnoses"

    payment_case_id: Mapped[UUID] = mapped_column(ForeignKey("payment_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    failure_code: Mapped[str | None] = mapped_column(String(100), index=True)
    root_cause: Mapped[str | None] = mapped_column(Text)
    confidence: Mapped[float | None] = mapped_column()
    remedy: Mapped[str | None] = mapped_column(Text)
    source_reference: Mapped[str | None] = mapped_column(String(500))
    next_action: Mapped[str | None] = mapped_column(Text)
    required_documents: Mapped[list | None] = mapped_column(JSONB)
    escalation: Mapped[str | None] = mapped_column(Text)

    payment_case: Mapped[PaymentCase] = relationship(back_populates="diagnoses")


class Action(UUIDTimestampModel):
    __tablename__ = "actions"

    citizen_id: Mapped[UUID] = mapped_column(ForeignKey("citizens.id", ondelete="CASCADE"), nullable=False, index=True)
    application_id: Mapped[UUID | None] = mapped_column(ForeignKey("applications.id", ondelete="CASCADE"), index=True)
    action_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[str] = mapped_column(String(30), nullable=False, default="medium", index=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="pending", index=True)
    due_date: Mapped[date | None] = mapped_column(Date)

    citizen: Mapped[Citizen] = relationship(back_populates="actions")
    application: Mapped[Application | None] = relationship(back_populates="actions")


class ApplicationEvent(UUIDTimestampModel):
    __tablename__ = "application_events"

    application_id: Mapped[UUID] = mapped_column(ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)

    application: Mapped[Application] = relationship(back_populates="events")


class AgentActivity(UUIDTimestampModel):
    __tablename__ = "agent_activities"

    session_id: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(150), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)


class AuditLog(UUIDTimestampModel):
    __tablename__ = "audit_logs"

    citizen_id: Mapped[UUID | None] = mapped_column(ForeignKey("citizens.id", ondelete="SET NULL"), index=True)
    application_id: Mapped[UUID | None] = mapped_column(ForeignKey("applications.id", ondelete="SET NULL"), index=True)
    document_id: Mapped[UUID | None] = mapped_column(ForeignKey("documents.id", ondelete="SET NULL"), index=True)
    actor: Mapped[str] = mapped_column(String(100), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    purpose: Mapped[str | None] = mapped_column(String(100))
    metadata_info: Mapped[dict | None] = mapped_column(JSONB)

class ProfileAttribute(UUIDTimestampModel):
    __tablename__ = "profile_attributes"
    __table_args__ = (Index("ix_profile_attributes_citizen_name", "citizen_id", "attribute_name", unique=True),)

    citizen_id: Mapped[UUID] = mapped_column(ForeignKey("citizens.id", ondelete="CASCADE"), nullable=False, index=True)
    attribute_name: Mapped[str] = mapped_column(String(100), nullable=False)
    attribute_value: Mapped[str | None] = mapped_column(Text)
    source: Mapped[str] = mapped_column(String(50), nullable=False) # USER_INPUT, DIGILOCKER
    status: Mapped[str] = mapped_column(String(50), nullable=False) # VERIFIED, SELF_DECLARED, PENDING, REQUIRES_DOCUMENT, FAILED, NOT_APPLICABLE
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    citizen: Mapped[Citizen] = relationship(back_populates="profile_attributes")


class DocumentVerification(UUIDTimestampModel):
    __tablename__ = "document_verifications"

    citizen_id: Mapped[UUID] = mapped_column(ForeignKey("citizens.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id: Mapped[UUID | None] = mapped_column(ForeignKey("documents.id", ondelete="SET NULL"), index=True)
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    document_type: Mapped[str] = mapped_column(String(100), nullable=False)
    verification_status: Mapped[str] = mapped_column(String(50), nullable=False)
    verified_fields: Mapped[dict | None] = mapped_column(JSONB)
    provider_reference: Mapped[str | None] = mapped_column(String(200))
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    failure_reason: Mapped[str | None] = mapped_column(Text)

    citizen: Mapped[Citizen] = relationship(back_populates="document_verifications")
    document: Mapped[Document | None] = relationship(back_populates="verification")


class SchemeEligibilityResult(UUIDTimestampModel):
    __tablename__ = "scheme_eligibility_results"
    __table_args__ = (Index("ix_eligibility_citizen_scheme", "citizen_id", "scheme_id", unique=True),)

    citizen_id: Mapped[UUID] = mapped_column(ForeignKey("citizens.id", ondelete="CASCADE"), nullable=False, index=True)
    scheme_id: Mapped[UUID] = mapped_column(ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False) # ELIGIBLE, NEEDS_VERIFICATION, LIKELY_ELIGIBLE, NOT_ELIGIBLE
    match_score: Mapped[str] = mapped_column(String(50)) # Strong Match, Likely Match
    reasons: Mapped[list | None] = mapped_column(JSONB)
    missing_information: Mapped[list | None] = mapped_column(JSONB)
    evaluated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    profile_version: Mapped[str | None] = mapped_column(String(100))

    citizen: Mapped[Citizen] = relationship(back_populates="eligibility_results")
    scheme: Mapped[Scheme] = relationship()


class DigiLockerSession(UUIDTimestampModel):
    __tablename__ = "digilocker_sessions"

    citizen_id: Mapped[UUID] = mapped_column(ForeignKey("citizens.id", ondelete="CASCADE"), nullable=False, index=True)
    state: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="started")
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    citizen: Mapped[Citizen] = relationship()
