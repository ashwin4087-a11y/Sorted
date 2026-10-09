"""store mismatch resolution plans

Revision ID: 0006_mismatch_resolution_plan
Revises: 0005_health_docs
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0006_mismatch_plan"
down_revision = "0005_health_docs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("mismatches", sa.Column("resolution_plan", postgresql.JSONB()))


def downgrade() -> None:
    op.drop_column("mismatches", "resolution_plan")
