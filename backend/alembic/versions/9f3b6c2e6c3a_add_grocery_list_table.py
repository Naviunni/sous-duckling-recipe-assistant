"""Add grocery list table

Revision ID: 9f3b6c2e6c3a
Revises: 6cd7384e2869
Create Date: 2025-11-20 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '9f3b6c2e6c3a'
down_revision: Union[str, Sequence[str], None] = '6cd7384e2869'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'grocery_lists',
        sa.Column('list_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('list_data', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
        sa.PrimaryKeyConstraint('list_id'),
        sa.UniqueConstraint('user_id')
    )


def downgrade() -> None:
    op.drop_table('grocery_lists')
