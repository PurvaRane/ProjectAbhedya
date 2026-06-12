import re

from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    sanitize_email,
    sanitize_mobile,
    verify_password,
)
from app.db.models import EmployeeAccount, User
from app.db.repositories import EmployeeRepository, UserRepository
from app.schemas.auth import (
    CustomerLoginRequest,
    EmailRegisterRequest,
    EmployeeLoginRequest,
    MobileCompleteRegistrationRequest,
    TokenResponse,
)
from app.services.otp_service import OTPService


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.employee_repo = EmployeeRepository(db)
        self.otp_service = OTPService(db)

    def register_customer_email(self, data: EmailRegisterRequest) -> tuple[User, str]:
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

    def verify_email_registration(self, email: str, otp_code: str) -> User:
        if not self.otp_service.verify_email_otp(email, otp_code):
            raise ValueError("Invalid or expired OTP")

        user = self.user_repo.get_by_email(email)
        if not user:
            raise ValueError("Registration not found for this email")

        return self.user_repo.activate(user)

    def send_mobile_registration_otp(self, mobile_number: str) -> tuple[int, str, bool]:
        if self.user_repo.get_by_mobile(mobile_number):
            raise ValueError("Mobile number is already registered")
        otp_code, expires_in, sms_delivered = self.otp_service.send_mobile_otp(mobile_number)
        return expires_in, otp_code, sms_delivered

    def verify_mobile_registration_otp(self, mobile_number: str, otp_code: str) -> None:
        if not self.otp_service.verify_mobile_otp(mobile_number, otp_code):
            raise ValueError("Invalid or expired OTP")

    def complete_mobile_registration(self, data: MobileCompleteRegistrationRequest) -> User:
        if not self.otp_service.is_mobile_verified(data.mobile_number):
            raise ValueError("Mobile number not verified. Complete OTP verification first")

        if self.user_repo.get_by_email(data.email):
            raise ValueError("Email is already registered")

        if self.user_repo.get_by_mobile(data.mobile_number):
            raise ValueError("Mobile number is already registered")

        return self.user_repo.create(
            full_name=data.full_name,
            email=data.email,
            mobile_number=data.mobile_number,
            pan_number=data.pan_number,
            password_hash=hash_password(data.password),
            is_active=True,
        )

    def login_customer(self, data: CustomerLoginRequest) -> TokenResponse:
        identifier = data.identifier.strip()
        user: User | None = None

        if "@" in identifier:
            user = self.user_repo.get_by_email(identifier)
        else:
            mobile = sanitize_mobile(identifier)
            if re.fullmatch(r"\d{10}", mobile):
                user = self.user_repo.get_by_mobile(mobile)
            else:
                user = self.user_repo.get_by_email(identifier)

        if not user or not verify_password(data.password, user.password_hash):
            raise ValueError("Invalid credentials")

        if not user.is_active:
            raise ValueError("Account is not activated. Please verify your email.")

        return TokenResponse(
            access_token=create_access_token(str(user.id), user.role.value, "customer"),
            refresh_token=create_refresh_token(str(user.id), "customer"),
            role=user.role.value,
            actor_type="customer",
        )

    def login_employee(self, data: EmployeeLoginRequest) -> TokenResponse:
        employee = self.employee_repo.get_by_email(data.email)
        if not employee or not verify_password(data.password, employee.password_hash):
            raise ValueError("Invalid credentials")

        if not employee.is_active:
            raise ValueError("Employee account is deactivated")

        return TokenResponse(
            access_token=create_access_token(
                str(employee.id), employee.role.value, "employee"
            ),
            refresh_token=create_refresh_token(str(employee.id), "employee"),
            role=employee.role.value,
            actor_type="employee",
        )
