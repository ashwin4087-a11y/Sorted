"""add document extraction fields

Revision ID: 0004_document_extraction_fields
Revises: 0003_expand_scheme_text_fields
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0004_document_extraction_fields"
down_revision = "0003_expand_scheme_text_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("documents", sa.Column("extracted_fields", postgresql.JSONB()))
    op.add_column("documents", sa.Column("original_filename", sa.String(255)))
    op.add_column("documents", sa.Column("mime_type", sa.String(100)))


def downgrade() -> None:
    op.drop_column("documents", "mime_type")
    op.drop_column("documents", "original_filename")
    op.drop_column("documents", "extracted_fields")
