from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import (
    EmployeeLoginRequest,
    EmployeeOTPVerifyRequest,
    EmployeeFaceVerifyRequest,
    EmployeeLoginStepResponse,
    EmployeeAuditLogResponse,
    TokenResponse,
)
from app.services.auth_service import AuthService
from app.services.captcha_service import CaptchaService

router = APIRouter(
    prefix="/employee",
    tags=["Employee Authentication"],
)

@router.get("/captcha")
def get_captcha():
    return CaptchaService.generate_captcha()

@router.post(
    "/login",
    response_model=EmployeeLoginStepResponse,
)
def employee_login(
    data: EmployeeLoginRequest,
    db: Session = Depends(get_db),
):
    try:
        return AuthService(db).initiate_employee_login(
            data
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc


@router.post(
    "/verify-otp",
    response_model=EmployeeLoginStepResponse,
)
def verify_employee_otp(
    data: EmployeeOTPVerifyRequest,
    db: Session = Depends(get_db),
):
    try:
        return AuthService(db).verify_employee_otp(
            data.email,
            data.otp_code,
            data.device_id
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc


@router.post(
    "/verify-face",
    response_model=TokenResponse,
)
def verify_employee_face(
    data: EmployeeFaceVerifyRequest,
    db: Session = Depends(get_db),
):
    try:
        return AuthService(db).verify_employee_face(
            data.email,
            data.image_base64,
            data.device_id
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc


@router.get(
    "/audit-logs",
    response_model=list[EmployeeAuditLogResponse],
)
def get_audit_logs(
    db: Session = Depends(get_db),
):
    return AuthService(db).get_employee_audit_logs()  

from fastapi.security import OAuth2PasswordBearer
from app.core.security import decode_token
from app.db.models import EmployeeAccount
from app.db.repositories import EmployeeRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/employee/login")

def get_current_employee(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> EmployeeAccount:
    payload = decode_token(token)
    if not payload or payload.get("type") != "employee":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    email = payload.get("sub")
    if email is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        
    employee = EmployeeRepository(db).get_by_email(email)
    if not employee:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Employee not found")
    if not employee.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive employee")
    return employee