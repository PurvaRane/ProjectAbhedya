"""Add Aadhaar and face fields

Revision ID: 002_add_aadhaar
Revises: 001_initial
Create Date: 2026-06-13
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision = "002_add_aadhaar"
down_revision = "001_initial"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("aadhaar_number", sa.String(12), nullable=True),
    )

    op.add_column(
        "users",
        sa.Column(
            "aadhaar_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )

    op.add_column(
        "users",
        sa.Column("face_embedding", sa.String(), nullable=True),
    )

    op.create_index(
        "ix_users_aadhaar_number",
        "users",
        ["aadhaar_number"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_users_aadhaar_number", table_name="users")

    op.drop_column("users", "face_embedding")
    op.drop_column("users", "aadhaar_verified")
    op.drop_column("users", "aadhaar_number")