"""add source dataset fields to schemes

Revision ID: 0002_scheme_dataset_fields
Revises: 0001_initial_database
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002_scheme_dataset_fields"
down_revision = "0001_initial_database"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("schemes", sa.Column("level", sa.String(100)))
    op.add_column("schemes", sa.Column("ministry", sa.String(200)))
    op.add_column("schemes", sa.Column("tags", postgresql.JSONB()))
    op.create_index("ix_schemes_level", "schemes", ["level"])
    op.create_index("ix_schemes_ministry", "schemes", ["ministry"])


def downgrade() -> None:
    op.drop_index("ix_schemes_ministry", table_name="schemes")
    op.drop_index("ix_schemes_level", table_name="schemes")
    op.drop_column("schemes", "tags")
    op.drop_column("schemes", "ministry")
    op.drop_column("schemes", "level")
