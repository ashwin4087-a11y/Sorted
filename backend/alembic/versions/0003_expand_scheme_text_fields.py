"""expand scheme text field lengths

Revision ID: 0003_expand_scheme_text_fields
Revises: 0002_scheme_dataset_fields
"""
from alembic import op
import sqlalchemy as sa

revision = "0003_expand_scheme_text_fields"
down_revision = "0002_scheme_dataset_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("schemes") as batch_op:
        batch_op.alter_column("name", type_=sa.String(300), existing_type=sa.String(200), existing_nullable=False)
        batch_op.alter_column("ministry", type_=sa.String(300), existing_type=sa.String(200), existing_nullable=True)

def downgrade() -> None:
    with op.batch_alter_table("schemes") as batch_op:
        batch_op.alter_column("ministry", type_=sa.String(200), existing_type=sa.String(300), existing_nullable=True)
        batch_op.alter_column("name", type_=sa.String(200), existing_type=sa.String(300), existing_nullable=False)
