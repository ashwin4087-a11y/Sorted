"""add payment diagnosis flow fields

Revision ID: 0007_payment_diagnosis_fields
Revises: 0006_mismatch_plan
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0007_payment_diag"
down_revision = "0006_mismatch_plan"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("payment_cases", sa.Column("answers", postgresql.JSONB()))
    op.add_column("payment_cases", sa.Column("current_question", sa.String(100)))
    op.add_column("diagnoses", sa.Column("next_action", sa.Text()))
    op.add_column("diagnoses", sa.Column("required_documents", postgresql.JSONB()))
    op.add_column("diagnoses", sa.Column("escalation", sa.Text()))


def downgrade() -> None:
    op.drop_column("diagnoses", "escalation")
    op.drop_column("diagnoses", "required_documents")
    op.drop_column("diagnoses", "next_action")
    op.drop_column("payment_cases", "current_question")
    op.drop_column("payment_cases", "answers")
