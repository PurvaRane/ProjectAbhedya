import re

from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    sanitize_mobile,
    verify_password,
)
from app.db.models import User
from app.db.repositories import (
    EmployeeAuditRepository,
    EmployeeRepository,
    UserRepository,
)
from app.schemas.auth import (
    AadhaarCompleteRegistrationRequest,
    AadhaarRegistrationRequest,
    CustomerLoginRequest,
    EmailRegisterRequest,
    EmployeeLoginRequest,
    MobileCompleteRegistrationRequest,
    TokenResponse,
    EmployeeAuditLogResponse
)
from app.services.otp_service import OTPService


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.employee_repo = EmployeeRepository(db)
        self.audit_repo = EmployeeAuditRepository(db)
        self.otp_service = OTPService(db)
    
    # ---------------------------------------------------
    # EMAIL REGISTRATION
    # ---------------------------------------------------

    def register_customer_email(self, data: EmailRegisterRequest):
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

    def verify_email_registration(
        self,
        email: str,
        otp_code: str,
    ):
        if not self.otp_service.verify_email_otp(
            email,
            otp_code,
        ):
            raise ValueError("Invalid or expired OTP")

        user = self.user_repo.get_by_email(email)

        if not user:
            raise ValueError("Registration not found")

        return self.user_repo.activate(user)

    # ---------------------------------------------------
    # MOBILE REGISTRATION
    # ---------------------------------------------------

    def send_mobile_registration_otp(
        self,
        mobile_number: str,
    ):
        if self.user_repo.get_by_mobile(mobile_number):
            raise ValueError("Mobile number already registered")

        otp_code, expires_in, sms_delivered = (
            self.otp_service.send_mobile_otp(
                mobile_number
            )
        )

        return expires_in, otp_code, sms_delivered

    def verify_mobile_registration_otp(
        self,
        mobile_number: str,
        otp_code: str,
    ):
        if not self.otp_service.verify_mobile_otp(
            mobile_number,
            otp_code,
        ):
            raise ValueError("Invalid or expired OTP")

    def complete_mobile_registration(
        self,
        data: MobileCompleteRegistrationRequest,
    ):
        if not self.otp_service.is_mobile_verified(
            data.mobile_number
        ):
            raise ValueError(
                "Mobile number not verified. Complete OTP verification first"
            )

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

    # ---------------------------------------------------
    # AADHAAR REGISTRATION
    # ---------------------------------------------------

    def send_aadhaar_registration_otp(
        self,
        data: AadhaarRegistrationRequest,
    ):
        if self.user_repo.get_by_aadhaar(
            data.aadhaar_number
        ):
            raise ValueError(
                "Aadhaar already registered"
            )

        otp_code, expires_in, sms_delivered = (
            self.otp_service.send_mobile_otp(
                data.mobile_number
            )
        )

        return expires_in, otp_code, sms_delivered

    def verify_aadhaar_registration_otp(
        self,
        mobile_number: str,
        otp_code: str,
    ):
        if not self.otp_service.verify_mobile_otp(
            mobile_number,
            otp_code,
        ):
            raise ValueError(
                "Invalid or expired OTP"
            )

    def complete_aadhaar_registration(
        self,
        data: AadhaarCompleteRegistrationRequest,
    ):

        if self.user_repo.get_by_aadhaar(
            data.aadhaar_number
        ):
            raise ValueError(
                "Aadhaar already registered"
            )

        if self.user_repo.get_by_email(
            data.email
        ):
            raise ValueError(
                "Email already registered"
            )

        if self.user_repo.get_by_mobile(
            data.mobile_number
        ):
            raise ValueError(
                "Mobile already registered"
            )

        return self.user_repo.create(
            full_name=data.full_name,
            email=data.email,
            mobile_number=data.mobile_number,
            pan_number=data.pan_number,
            aadhaar_number=data.aadhaar_number,
            aadhaar_verified=True,
            password_hash=hash_password(
                data.password
            ),
            is_active=True,
        )

    # ---------------------------------------------------
    # CUSTOMER LOGIN
    # ---------------------------------------------------

    def login_customer(
        self,
        data: CustomerLoginRequest,
    ) -> TokenResponse:

        identifier = data.identifier.strip()

        user: User | None = None

        if "@" in identifier:
            user = self.user_repo.get_by_email(
                identifier
            )
        else:
            mobile = sanitize_mobile(
                identifier
            )

            if re.fullmatch(
                r"\d{10}",
                mobile,
            ):
                user = self.user_repo.get_by_mobile(
                    mobile
                )
            else:
                user = self.user_repo.get_by_email(
                    identifier
                )

        if (
            not user
            or not verify_password(
                data.password,
                user.password_hash,
            )
        ):
            raise ValueError(
                "Invalid credentials"
            )

        if not user.is_active:
            raise ValueError(
                "Account is not activated"
            )

        return TokenResponse(
            access_token=create_access_token(
                str(user.id),
                user.role.value,
                "customer",
            ),
            refresh_token=create_refresh_token(
                str(user.id),
                "customer",
            ),
            role=user.role.value,
            actor_type="customer",
        )

    # ---------------------------------------------------
    # EMPLOYEE LOGIN
    # ---------------------------------------------------

    def login_employee(
        self,
        data: EmployeeLoginRequest,
    ) -> TokenResponse:

        employee = self.employee_repo.get_by_email(
            data.email
        )

        if (
            not employee
            or not verify_password(
                data.password,
                employee.password_hash,
            )
        ):

            self.audit_repo.create_log(
                action="LOGIN",
                status="FAILED",
                details=f"Failed login attempt for {data.email}",
            )

            raise ValueError(
                "Invalid credentials"
            )

        if not employee.is_active:

            self.audit_repo.create_log(
                action="LOGIN",
                status="FAILED",
                employee_id=employee.id,
                details="Employee account deactivated",
            )

            raise ValueError(
                "Employee account is deactivated"
            )

        self.audit_repo.create_log(
            action="LOGIN",
            status="SUCCESS",
            employee_id=employee.id,
            details=f"{employee.role.value} login successful",
        )

        return TokenResponse(
            access_token=create_access_token(
                str(employee.id),
                employee.role.value,
                "employee",
            ),
            refresh_token=create_refresh_token(
                str(employee.id),
                "employee",
            ),
            role=employee.role.value,
            actor_type="employee",
        )
    
    def initiate_employee_login(
        self,
        data: EmployeeLoginRequest,
    ):
        employee = self.employee_repo.get_by_email(
            data.email
        )

        if (
            not employee
            or not verify_password(
                data.password,
                employee.password_hash,
            )
        ):
            raise ValueError(
                "Invalid credentials"
            )

        if not employee.is_active:
            raise ValueError(
                "Employee account is deactivated"
            )

        self.otp_service.send_email_otp(
            employee.email
        )

        return {
            "message": "OTP sent successfully",
            "otp_sent": True,
        }
    def verify_employee_otp(
        self,
        email: str,
        otp_code: str,
    ) -> TokenResponse:

        employee = self.employee_repo.get_by_email(email)

        if not employee:
            raise ValueError("Employee not found")

        if not self.otp_service.verify_email_otp(
            email,
            otp_code,
        ):
            self.audit_repo.create_log(
                action="LOGIN",
                status="FAILED",
                employee_id=employee.id,
                details="Invalid OTP",
            )

            raise ValueError(
                "Invalid or expired OTP"
            )

        self.audit_repo.create_log(
            action="LOGIN",
            status="SUCCESS",
            employee_id=employee.id,
            details=f"{employee.role.value} login successful",
        )

        return TokenResponse(
            access_token=create_access_token(
                str(employee.id),
                employee.role.value,
                "employee",
            ),
            refresh_token=create_refresh_token(
                str(employee.id),
                "employee",
            ),
            role=employee.role.value,
            actor_type="employee",
        )
    # ---------------------------------------------------
    # AUDIT LOGS
    # ---------------------------------------------------

    def get_employee_audit_logs(
        self,
    ):
        return self.audit_repo.get_logs()