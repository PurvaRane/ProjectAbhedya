from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.repositories import UserRepository
from app.schemas.auth import (
    AadhaarCompleteRegistrationRequest,
    AadhaarRegistrationRequest,
    EmailRegisterRequest,
    MobileCompleteRegistrationRequest,
)
from app.services.otp_service import OTPService


class CustomerRegistrationService:
    def __init__(self, db: Session, user_repo: UserRepository, otp_service: OTPService):
        self.db = db
        self.user_repo = user_repo
        self.otp_service = otp_service

    def _handle_integrity_error(self, exc: IntegrityError) -> None:
        self.db.rollback()
        if "users_pan_number_key" in str(exc):
            raise ValueError("PAN number is already registered") from exc
        raise ValueError("Registration failed due to a duplicate unique identifier.") from exc

    def register_email(self, data: EmailRegisterRequest):
        if self.user_repo.get_by_email(data.email):
            raise ValueError("Email is already registered")

        user = self.user_repo.create(
            full_name=data.full_name,
            email=data.email,
            password_hash=hash_password(data.password),
            is_active=False,
        )
        otp_code, _ = self.otp_service.send_email_otp(data.email)
        return user, otp_code

    def verify_email(self, email: str, otp_code: str):
        if not self.otp_service.verify_email_otp(email, otp_code):
            raise ValueError("Invalid or expired OTP")

        user = self.user_repo.get_by_email(email)
        if not user:
            raise ValueError("Registration not found")

        return self.user_repo.activate(user)

    def send_mobile_otp(self, mobile_number: str):
        if self.user_repo.get_by_mobile(mobile_number):
            raise ValueError("Mobile number already registered")

        otp_code, expires_in, sms_delivered = self.otp_service.send_mobile_otp(mobile_number)
        return expires_in, otp_code, sms_delivered

    def verify_mobile_otp(self, mobile_number: str, otp_code: str) -> None:
        if not self.otp_service.verify_mobile_otp(mobile_number, otp_code):
            raise ValueError("Invalid or expired OTP")

    def complete_mobile(self, data: MobileCompleteRegistrationRequest):
        if not self.otp_service.is_mobile_verified(data.mobile_number):
            raise ValueError("Mobile number not verified. Complete OTP verification first")

        if self.user_repo.get_by_email(data.email):
            raise ValueError("Email is already registered")

        if self.user_repo.get_by_mobile(data.mobile_number):
            raise ValueError("Mobile number is already registered")

        try:
            return self.user_repo.create(
                full_name=data.full_name,
                email=data.email,
                mobile_number=data.mobile_number,
                pan_number=data.pan_number,
                password_hash=hash_password(data.password),
                is_active=True,
            )
        except IntegrityError as exc:
            self._handle_integrity_error(exc)

    def send_aadhaar_otp(self, data: AadhaarRegistrationRequest):
        if self.user_repo.get_by_aadhaar(data.aadhaar_number):
            raise ValueError("Aadhaar already registered")

        otp_code, expires_in, sms_delivered = self.otp_service.send_mobile_otp(data.mobile_number)
        return expires_in, otp_code, sms_delivered

    def verify_aadhaar_otp(self, mobile_number: str, otp_code: str) -> None:
        if not self.otp_service.verify_mobile_otp(mobile_number, otp_code):
            raise ValueError("Invalid or expired OTP")

    def complete_aadhaar(self, data: AadhaarCompleteRegistrationRequest):
        if self.user_repo.get_by_aadhaar(data.aadhaar_number):
            raise ValueError("Aadhaar already registered")

        if self.user_repo.get_by_email(data.email):
            raise ValueError("Email already registered")

        if self.user_repo.get_by_mobile(data.mobile_number):
            raise ValueError("Mobile already registered")

        try:
            return self.user_repo.create(
                full_name=data.full_name,
                email=data.email,
                mobile_number=data.mobile_number,
                pan_number=data.pan_number,
                aadhaar_number=data.aadhaar_number,
                aadhaar_verified=True,
                password_hash=hash_password(data.password),
                is_active=True,
            )
        except IntegrityError as exc:
            self._handle_integrity_error(exc)
