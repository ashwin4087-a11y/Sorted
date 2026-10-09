"""create initial Sorted database tables

Revision ID: 0001_initial_database
Revises:
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial_database"
down_revision = None
branch_labels = None
depends_on = None

uuid = postgresql.UUID(as_uuid=True)
jsonb = postgresql.JSONB()


def id_column():
    return sa.Column("id", uuid, primary_key=True, nullable=False)


def created_column():
    return sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now())


def upgrade() -> None:
    op.create_table("citizens", id_column(), sa.Column("name", sa.String(160), nullable=False), sa.Column("phone", sa.String(32), nullable=False), sa.Column("language", sa.String(32), nullable=False), sa.Column("state", sa.String(100), nullable=False), sa.Column("district", sa.String(100), nullable=False), created_column())
    op.create_index("ix_citizens_phone", "citizens", ["phone"])
    op.create_index("ix_citizens_state", "citizens", ["state"])
    op.create_index("ix_citizens_district", "citizens", ["district"])

    op.create_table("schemes", id_column(), sa.Column("scheme_code", sa.String(100), nullable=False), sa.Column("name", sa.String(200), nullable=False), sa.Column("description", sa.Text()), sa.Column("category", sa.String(100)), sa.Column("state", sa.String(100)), sa.Column("eligibility", jsonb), sa.Column("benefits", jsonb), sa.Column("required_documents", jsonb), sa.Column("application_process", jsonb), sa.Column("official_url", sa.String(500)), sa.Column("myscheme_url", sa.String(500)), sa.Column("source", sa.String(200)), sa.Column("last_verified", sa.DateTime(timezone=True)), created_column(), sa.UniqueConstraint("scheme_code"))
    op.create_index("ix_schemes_scheme_code", "schemes", ["scheme_code"])
    op.create_index("ix_schemes_name", "schemes", ["name"])
    op.create_index("ix_schemes_category", "schemes", ["category"])
    op.create_index("ix_schemes_state", "schemes", ["state"])

    op.create_table("applications", id_column(), sa.Column("citizen_id", uuid, sa.ForeignKey("citizens.id", ondelete="CASCADE"), nullable=False), sa.Column("scheme_id", uuid, sa.ForeignKey("schemes.id", ondelete="RESTRICT"), nullable=False), sa.Column("application_number", sa.String(100), unique=True), sa.Column("status", sa.String(50), nullable=False), sa.Column("submitted_at", sa.DateTime(timezone=True)), sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False), created_column())
    op.create_index("ix_applications_citizen_id", "applications", ["citizen_id"])
    op.create_index("ix_applications_scheme_id", "applications", ["scheme_id"])
    op.create_index("ix_applications_application_number", "applications", ["application_number"])
    op.create_index("ix_applications_status", "applications", ["status"])
    op.create_index("ix_applications_citizen_status", "applications", ["citizen_id", "status"])

    op.create_table("documents", id_column(), sa.Column("citizen_id", uuid, sa.ForeignKey("citizens.id", ondelete="CASCADE"), nullable=False), sa.Column("application_id", uuid, sa.ForeignKey("applications.id", ondelete="CASCADE")), sa.Column("document_type", sa.String(100), nullable=False), sa.Column("document_number", sa.String(150)), sa.Column("holder_name", sa.String(160)), sa.Column("date_of_birth", sa.Date()), sa.Column("address", sa.Text()), sa.Column("issue_date", sa.Date()), sa.Column("expiry_date", sa.Date()), sa.Column("file_path", sa.String(500)), sa.Column("verification_status", sa.String(50), nullable=False), sa.Column("extraction_confidence", sa.Float()), created_column())
    op.create_index("ix_documents_citizen_id", "documents", ["citizen_id"])
    op.create_index("ix_documents_application_id", "documents", ["application_id"])
    op.create_index("ix_documents_document_type", "documents", ["document_type"])
    op.create_index("ix_documents_document_number", "documents", ["document_number"])
    op.create_index("ix_documents_verification_status", "documents", ["verification_status"])
    op.create_index("ix_documents_application_type", "documents", ["application_id", "document_type"])

    op.create_table("health_checks", id_column(), sa.Column("application_id", uuid, sa.ForeignKey("applications.id", ondelete="CASCADE"), nullable=False), sa.Column("overall_status", sa.String(50), nullable=False), sa.Column("issues_found", jsonb), sa.Column("checked_at", sa.DateTime(timezone=True), nullable=False), created_column())
    op.create_index("ix_health_checks_application_id", "health_checks", ["application_id"])
    op.create_index("ix_health_checks_overall_status", "health_checks", ["overall_status"])

    op.create_table("mismatches", id_column(), sa.Column("application_id", uuid, sa.ForeignKey("applications.id", ondelete="CASCADE"), nullable=False), sa.Column("field_name", sa.String(100), nullable=False), sa.Column("source_document", sa.String(100), nullable=False), sa.Column("conflicting_document", sa.String(100), nullable=False), sa.Column("source_value", sa.Text()), sa.Column("conflicting_value", sa.Text()), sa.Column("severity", sa.String(30), nullable=False), sa.Column("recommended_action", sa.Text()), sa.Column("status", sa.String(30), nullable=False), created_column())
    op.create_index("ix_mismatches_application_id", "mismatches", ["application_id"])
    op.create_index("ix_mismatches_severity", "mismatches", ["severity"])
    op.create_index("ix_mismatches_status", "mismatches", ["status"])

    op.create_table("payment_cases", id_column(), sa.Column("citizen_id", uuid, sa.ForeignKey("citizens.id", ondelete="CASCADE"), nullable=False), sa.Column("application_id", uuid, sa.ForeignKey("applications.id", ondelete="SET NULL")), sa.Column("payment_status", sa.String(50), nullable=False), sa.Column("reported_problem", sa.Text()), created_column())
    op.create_index("ix_payment_cases_citizen_id", "payment_cases", ["citizen_id"])
    op.create_index("ix_payment_cases_application_id", "payment_cases", ["application_id"])
    op.create_index("ix_payment_cases_payment_status", "payment_cases", ["payment_status"])

    op.create_table("diagnoses", id_column(), sa.Column("payment_case_id", uuid, sa.ForeignKey("payment_cases.id", ondelete="CASCADE"), nullable=False), sa.Column("failure_code", sa.String(100)), sa.Column("root_cause", sa.Text()), sa.Column("confidence", sa.Float()), sa.Column("remedy", sa.Text()), sa.Column("source_reference", sa.String(500)), created_column())
    op.create_index("ix_diagnoses_payment_case_id", "diagnoses", ["payment_case_id"])
    op.create_index("ix_diagnoses_failure_code", "diagnoses", ["failure_code"])

    op.create_table("actions", id_column(), sa.Column("citizen_id", uuid, sa.ForeignKey("citizens.id", ondelete="CASCADE"), nullable=False), sa.Column("application_id", uuid, sa.ForeignKey("applications.id", ondelete="CASCADE")), sa.Column("action_type", sa.String(100), nullable=False), sa.Column("description", sa.Text(), nullable=False), sa.Column("priority", sa.String(30), nullable=False), sa.Column("status", sa.String(30), nullable=False), sa.Column("due_date", sa.Date()), created_column())
    op.create_index("ix_actions_citizen_id", "actions", ["citizen_id"])
    op.create_index("ix_actions_application_id", "actions", ["application_id"])
    op.create_index("ix_actions_action_type", "actions", ["action_type"])
    op.create_index("ix_actions_priority", "actions", ["priority"])
    op.create_index("ix_actions_status", "actions", ["status"])

    op.create_table("application_events", id_column(), sa.Column("application_id", uuid, sa.ForeignKey("applications.id", ondelete="CASCADE"), nullable=False), sa.Column("event_type", sa.String(100), nullable=False), sa.Column("description", sa.Text()), created_column())
    op.create_index("ix_application_events_application_id", "application_events", ["application_id"])
    op.create_index("ix_application_events_event_type", "application_events", ["event_type"])

    op.create_table("agent_activities", id_column(), sa.Column("session_id", sa.String(150), nullable=False), sa.Column("action", sa.String(150), nullable=False), sa.Column("status", sa.String(50), nullable=False), sa.Column("description", sa.Text()), created_column())
    op.create_index("ix_agent_activities_session_id", "agent_activities", ["session_id"])
    op.create_index("ix_agent_activities_status", "agent_activities", ["status"])


def downgrade() -> None:
    for table in ("agent_activities", "application_events", "actions", "diagnoses", "payment_cases", "mismatches", "health_checks", "documents", "applications", "schemes", "citizens"):
        op.drop_table(table)
