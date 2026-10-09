"""merge heads

Revision ID: 6bbdfe2a11f2
Revises: 29c0d5fbb1d1, f386594ccc33
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '6bbdfe2a11f2'
down_revision: Union[str, None] = ('29c0d5fbb1d1', 'f386594ccc33')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
