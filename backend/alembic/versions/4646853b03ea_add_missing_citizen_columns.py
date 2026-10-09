"""add missing citizen columns

Revision ID: 4646853b03ea
Revises: 6bbdfe2a11f2
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '4646853b03ea'
down_revision: Union[str, None] = '6bbdfe2a11f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('citizens', sa.Column('operator_id', sa.UUID(), nullable=True))
    # Add is_verified as nullable first (existing rows), backfill, then set NOT NULL
    op.add_column('citizens', sa.Column('is_verified', sa.Boolean(), nullable=True, server_default=sa.text('false')))
    op.execute("UPDATE citizens SET is_verified = false WHERE is_verified IS NULL")
    op.alter_column('citizens', 'is_verified', nullable=False)
    op.add_column('citizens', sa.Column('verification_source', sa.String(length=50), nullable=True))
    op.add_column('citizens', sa.Column('digilocker_id', sa.String(length=100), nullable=True))
    op.add_column('citizens', sa.Column('profile_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.create_index(op.f('ix_citizens_digilocker_id'), 'citizens', ['digilocker_id'], unique=True)
    op.create_index(op.f('ix_citizens_operator_id'), 'citizens', ['operator_id'], unique=False)
    op.create_foreign_key(None, 'citizens', 'operators', ['operator_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    op.drop_constraint(None, 'citizens', type_='foreignkey')
    op.drop_index(op.f('ix_citizens_operator_id'), table_name='citizens')
    op.drop_index(op.f('ix_citizens_digilocker_id'), table_name='citizens')
    op.drop_column('citizens', 'profile_data')
    op.drop_column('citizens', 'digilocker_id')
    op.drop_column('citizens', 'verification_source')
    op.drop_column('citizens', 'is_verified')
    op.drop_column('citizens', 'operator_id')
