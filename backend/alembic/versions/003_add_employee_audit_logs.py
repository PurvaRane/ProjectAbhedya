"""add employee audit logs

Revision ID: 003_add_employee_audit_logs
Revises: 002_add_aadhaar
Create Date: 2026-06-20
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "003_add_employee_audit_logs"
down_revision = "002_add_aadhaar"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "employee_audit_logs",

        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),

        sa.Column(
            "employee_id",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),

        sa.Column(
            "action",
            sa.String(length=100),
            nullable=False,
        ),

        sa.Column(
            "status",
            sa.String(length=50),
            nullable=False,
        ),

        sa.Column(
            "ip_address",
            sa.String(length=100),
            nullable=True,
        ),

        sa.Column(
            "device_id",
            sa.String(length=255),
            nullable=True,
        ),

        sa.Column(
            "details",
            sa.String(length=500),
            nullable=True,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),

        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_employee_audit_logs_employee_id",
        "employee_audit_logs",
        ["employee_id"],
    )


def downgrade():
    op.drop_index(
        "ix_employee_audit_logs_employee_id",
        table_name="employee_audit_logs",
    )

    op.drop_table("employee_audit_logs")