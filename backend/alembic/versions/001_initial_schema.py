"""Initial schema

Revision ID: 001_initial
Revises:
Create Date: 2026-06-12

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    user_role_enum = postgresql.ENUM("CUSTOMER", name="userrole")
    employee_role_enum = postgresql.ENUM(
        "ADMIN", "FRAUD_ANALYST", "LOAN_OFFICER", name="employeerole"
    )
    user_role_enum.create(op.get_bind(), checkfirst=True)
    employee_role_enum.create(op.get_bind(), checkfirst=True)

    user_role = postgresql.ENUM("CUSTOMER", name="userrole", create_type=False)
    employee_role = postgresql.ENUM(
        "ADMIN", "FRAUD_ANALYST", "LOAN_OFFICER", name="employeerole", create_type=False
    )

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("mobile_number", sa.String(15), nullable=True),
        sa.Column("pan_number", sa.String(10), nullable=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("mobile_number"),
        sa.UniqueConstraint("pan_number"),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_mobile_number", "users", ["mobile_number"])

    op.create_table(
        "employee_accounts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", employee_role, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_employee_accounts_email", "employee_accounts", ["email"])

    op.create_table(
        "otp_verifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("mobile_number", sa.String(15), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("otp_code", sa.String(10), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_otp_verifications_mobile_number", "otp_verifications", ["mobile_number"])
    op.create_index("ix_otp_verifications_email", "otp_verifications", ["email"])


def downgrade() -> None:
    op.drop_index("ix_otp_verifications_email", table_name="otp_verifications")
    op.drop_index("ix_otp_verifications_mobile_number", table_name="otp_verifications")
    op.drop_table("otp_verifications")

    op.drop_index("ix_employee_accounts_email", table_name="employee_accounts")
    op.drop_table("employee_accounts")

    op.drop_index("ix_users_mobile_number", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    op.execute("DROP TYPE IF EXISTS employeerole")
    op.execute("DROP TYPE IF EXISTS userrole")
