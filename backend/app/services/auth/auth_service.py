from sqlalchemy.orm import Session

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
)
from app.services.auth.customer_login_service import CustomerLoginService
from app.services.auth.customer_registration_service import CustomerRegistrationService
from app.services.auth.employee_auth_service import EmployeeAuthService
from app.services.otp_service import OTPService


class AuthService:
    """Facade delegating to focused auth sub-services (backward compatible API)."""

    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.employee_repo = EmployeeRepository(db)
        self.audit_repo = EmployeeAuditRepository(db)
        self.otp_service = OTPService(db)

        self._registration = CustomerRegistrationService(db, self.user_repo, self.otp_service)
        self._customer_login = CustomerLoginService(self.user_repo)
        self._employee_auth = EmployeeAuthService(
            db,
            self.employee_repo,
            self.audit_repo,
            self.otp_service,
        )

    # Customer registration
    def register_customer_email(self, data: EmailRegisterRequest):
        return self._registration.register_email(data)

    def verify_email_registration(self, email: str, otp_code: str):
        return self._registration.verify_email(email, otp_code)

    def send_mobile_registration_otp(self, mobile_number: str):
        return self._registration.send_mobile_otp(mobile_number)

    def verify_mobile_registration_otp(self, mobile_number: str, otp_code: str):
        return self._registration.verify_mobile_otp(mobile_number, otp_code)

    def complete_mobile_registration(self, data: MobileCompleteRegistrationRequest):
        return self._registration.complete_mobile(data)

    def send_aadhaar_registration_otp(self, data: AadhaarRegistrationRequest):
        return self._registration.send_aadhaar_otp(data)

    def verify_aadhaar_registration_otp(self, mobile_number: str, otp_code: str):
        return self._registration.verify_aadhaar_otp(mobile_number, otp_code)

    def complete_aadhaar_registration(self, data: AadhaarCompleteRegistrationRequest):
        return self._registration.complete_aadhaar(data)

    # Customer login
    def login_customer(self, data: CustomerLoginRequest) -> TokenResponse:
        return self._customer_login.login(data)

    # Employee auth
    def login_employee(self, data: EmployeeLoginRequest) -> TokenResponse:
        return self._employee_auth.login(data)

    def initiate_employee_login(self, data: EmployeeLoginRequest):
        return self._employee_auth.initiate_login(data)

    def verify_employee_otp(self, email: str, otp_code: str, device_id: str):
        return self._employee_auth.verify_otp(email, otp_code, device_id)

    def verify_employee_face(self, email: str, image_base64: str, device_id: str) -> TokenResponse:
        return self._employee_auth.verify_face(email, image_base64, device_id)

    def get_employee_audit_logs(self):
        return self._employee_auth.get_audit_logs()
