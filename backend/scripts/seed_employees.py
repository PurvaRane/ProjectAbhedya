"""Seed default employee accounts for VeriTrust."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.security import hash_password
from app.db.models import EmployeeAccount, EmployeeRole
from app.db.session import SessionLocal


EMPLOYEES = [
    {
        "email": "admin@veritrust.in",
        "password": "Admin@12345",
        "role": EmployeeRole.ADMIN,
    },
    {
        "email": "analyst@veritrust.in",
        "password": "Analyst@12345",
        "role": EmployeeRole.FRAUD_ANALYST,
    },
    {
        "email": "officer@veritrust.in",
        "password": "Officer@12345",
        "role": EmployeeRole.LOAN_OFFICER,
    },
]


def seed_employees() -> None:
    db = SessionLocal()
    try:
        for emp in EMPLOYEES:
            existing = (
                db.query(EmployeeAccount)
                .filter(EmployeeAccount.email == emp["email"])
                .first()
            )
            if existing:
                print(f"Employee already exists: {emp['email']}")
                continue

            employee = EmployeeAccount(
                email=emp["email"],
                password_hash=hash_password(emp["password"]),
                role=emp["role"],
                is_active=True,
            )
            db.add(employee)
            print(f"Seeded employee: {emp['email']} ({emp['role'].value})")

        db.commit()
        print("Employee seeding completed.")
    except Exception as exc:
        db.rollback()
        print(f"Seeding failed: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_employees()
