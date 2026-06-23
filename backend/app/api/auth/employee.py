from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import (
    EmployeeLoginRequest,
    EmployeeOTPVerifyRequest,
    EmployeeLoginOTPResponse,
    EmployeeAuditLogResponse,
    TokenResponse,
)
from app.services.auth_service import AuthService

router = APIRouter(
    prefix="/employee",
    tags=["Employee Authentication"],
)


@router.post(
    "/login",
    response_model=EmployeeLoginOTPResponse,
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
    response_model=TokenResponse,
)
def verify_employee_otp(
    data: EmployeeOTPVerifyRequest,
    db: Session = Depends(get_db),
):
    try:
        return AuthService(db).verify_employee_otp(
            data.email,
            data.otp_code,
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