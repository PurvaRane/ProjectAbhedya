from fastapi import APIRouter, Depends, HTTPException, status, Response
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
from app.core.exceptions import employee_login_error_response
from fastapi.security import OAuth2PasswordBearer
from app.core.security import decode_token
from fastapi import Request
from app.db.models import EmployeeAccount
from app.db.repositories import EmployeeRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/employee/login", auto_error=False)

def get_current_employee(
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> EmployeeAccount:
    if not token:
        token = request.cookies.get("access_token")
        
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    payload = decode_token(token)
    if not payload or payload.get("type") != "employee":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        
    import uuid
    try:
        emp_id = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload format")
        
    employee = EmployeeRepository(db).get_by_id(emp_id)
    if not employee:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Employee not found")
    if not employee.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive employee")
    return employee

router = APIRouter(
    prefix="/employee",
    tags=["Employee Authentication"],
)

@router.get("/captcha")
def get_captcha():
    return CaptchaService.generate_captcha()

@router.post("/logout")
def employee_logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out successfully"}

@router.get("/me")
def get_me(
    current_employee: EmployeeAccount = Depends(get_current_employee)
):
    return {
        "id": str(current_employee.id),
        "email": current_employee.email,
        "role": current_employee.role.value
    }

@router.post(
    "/login",
    response_model=EmployeeLoginStepResponse,
)
def employee_login(
    data: EmployeeLoginRequest,
    db: Session = Depends(get_db),
):
    try:
        return AuthService(db).initiate_employee_login(data)
    except HTTPException:
        raise
    except Exception as exc:
        raise employee_login_error_response(exc) from exc


@router.post(
    "/verify-otp",
    response_model=EmployeeLoginStepResponse,
)
def verify_employee_otp(
    data: EmployeeOTPVerifyRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    try:
        res = AuthService(db).verify_employee_otp(
            data.email,
            data.otp_code,
            data.device_id
        )
        
        next_step = res.get("next_step") if isinstance(res, dict) else res.next_step
        token_data = res.get("token_data") if isinstance(res, dict) else getattr(res, "token_data", None)
        
        if next_step == "SUCCESS" and token_data:
            access_token = token_data.get("access_token") if isinstance(token_data, dict) else token_data.access_token
            refresh_token = token_data.get("refresh_token") if isinstance(token_data, dict) else token_data.refresh_token
            
            response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="strict", max_age=30*60, path="/")
            response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="strict", max_age=7*24*60*60, path="/")
        return res
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
    response: Response,
    db: Session = Depends(get_db),
):
    try:
        token_data = AuthService(db).verify_employee_face(
            data.email,
            data.image_base64,
            data.device_id
        )
        response.set_cookie(key="access_token", value=token_data.access_token, httponly=True, secure=True, samesite="strict", max_age=30*60, path="/")
        response.set_cookie(key="refresh_token", value=token_data.refresh_token, httponly=True, secure=True, samesite="strict", max_age=7*24*60*60, path="/")
        return token_data
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
    current_employee: EmployeeAccount = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    return AuthService(db).get_employee_audit_logs()
