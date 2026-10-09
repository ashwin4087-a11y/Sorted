"""store compared documents on health checks

Revision ID: 0005_health_check_compared_documents
Revises: 0004_document_extraction_fields
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0005_health_docs"
down_revision = "0004_document_extraction_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("health_checks", sa.Column("documents_compared", postgresql.JSONB()))


def downgrade() -> None:
    op.drop_column("health_checks", "documents_compared")
