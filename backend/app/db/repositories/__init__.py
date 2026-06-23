from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.security import hash_password, sanitize_email, sanitize_mobile, sanitize_string
from app.db.models import (
    EmployeeAccount,
    EmployeeAuditLog,
    EmployeeRole,
    OTPVerification,
    User,
    UserRole,
)

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == sanitize_email(email)).first()

    def get_by_mobile(self, mobile: str) -> User | None:
        return self.db.query(User).filter(User.mobile_number == sanitize_mobile(mobile)).first()

    def get_by_aadhaar(self, aadhaar_number: str) -> User | None:
        return (
            self.db.query(User)
            .filter(User.aadhaar_number == aadhaar_number)
            .first()
        )

    def get_by_id(self, user_id: UUID) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()

    def create(
        self,
        full_name: str,
        email: str,
        password_hash: str,
        mobile_number: str | None = None,
        pan_number: str | None = None,
        aadhaar_number: str | None = None,
        aadhaar_verified: bool = False,
        face_embedding: str | None = None,
        is_active: bool = False,
    ) -> User:
        user = User(
            full_name=sanitize_string(full_name),
            email=sanitize_email(email),
            mobile_number=sanitize_mobile(mobile_number) if mobile_number else None,
            pan_number=pan_number.upper() if pan_number else None,
            aadhaar_number=aadhaar_number,
            aadhaar_verified=aadhaar_verified,
            face_embedding=face_embedding,
            password_hash=password_hash,
            role=UserRole.CUSTOMER,
            is_active=is_active,
        )

        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        return user

    def activate(self, user: User) -> User:
        user.is_active = True
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def update_face_embedding(
        self,
        user: User,
        embedding: str,
    ) -> User:

        user.face_embedding = embedding

        self.db.commit()
        self.db.refresh(user)

        return user

    def update_aadhaar_verification(
        self,
        user: User,
        aadhaar_verified: bool = True,
    ) -> User:
        user.aadhaar_verified = aadhaar_verified

        self.db.commit()
        self.db.refresh(user)

        return user

    def update_face_embedding(
        self,
        user: User,
        face_embedding: str,
    ) -> User:
        user.face_embedding = face_embedding

        self.db.commit()
        self.db.refresh(user)

        return user


class EmployeeRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> EmployeeAccount | None:
        return (
            self.db.query(EmployeeAccount)
            .filter(EmployeeAccount.email == sanitize_email(email))
            .first()
        )

    def create(
        self,
        email: str,
        password: str,
        role: EmployeeRole,
    ) -> EmployeeAccount:
        employee = EmployeeAccount(
            email=sanitize_email(email),
            password_hash=hash_password(password),
            role=role,
            is_active=True,
        )

        self.db.add(employee)
        self.db.commit()
        self.db.refresh(employee)

        return employee

    def count(self) -> int:
        return self.db.query(EmployeeAccount).count()

class EmployeeAuditRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_log(
        self,
        action: str,
        status: str,
        employee_id: UUID | None = None,
        ip_address: str | None = None,
        device_id: str | None = None,
        details: str | None = None,
    ) -> EmployeeAuditLog:

        log = EmployeeAuditLog(
            employee_id=employee_id,
            action=action,
            status=status,
            ip_address=ip_address,
            device_id=device_id,
            details=details,
        )

        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)

        return log
        
    def get_logs(
        self,
        limit: int = 100,
    ):
        return (
            self.db.query(EmployeeAuditLog)
            .order_by(
                EmployeeAuditLog.created_at.desc()
            )
            .limit(limit)
            .all()
        )


class OTPRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        otp_code: str,
        expires_at: datetime,
        mobile_number: str | None = None,
        email: str | None = None,
    ) -> OTPVerification:
        otp = OTPVerification(
            mobile_number=sanitize_mobile(mobile_number) if mobile_number else None,
            email=sanitize_email(email) if email else None,
            otp_code=otp_code,
            expires_at=expires_at,
            verified=False,
        )

        self.db.add(otp)
        self.db.commit()
        self.db.refresh(otp)

        return otp

    def get_latest_unverified(
        self,
        mobile_number: str | None = None,
        email: str | None = None,
    ) -> OTPVerification | None:
        query = self.db.query(OTPVerification).filter(
            OTPVerification.verified.is_(False)
        )

        if mobile_number:
            query = query.filter(
                OTPVerification.mobile_number == sanitize_mobile(mobile_number)
            )

        if email:
            query = query.filter(
                OTPVerification.email == sanitize_email(email)
            )

        return query.order_by(
            OTPVerification.created_at.desc()
        ).first()

    def mark_verified(self, otp: OTPVerification) -> OTPVerification:
        otp.verified = True

        self.db.commit()
        self.db.refresh(otp)

        return otp

    def is_expired(self, otp: OTPVerification) -> bool:
        now = datetime.now(timezone.utc)

        expires = otp.expires_at

        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)

        return now > expires