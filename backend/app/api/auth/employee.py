from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import EmployeeLoginRequest, TokenResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/employee", tags=["Employee Authentication"])


@router.post("/login", response_model=TokenResponse)
def employee_login(data: EmployeeLoginRequest, db: Session = Depends(get_db)):
    try:
        return AuthService(db).login_employee(data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
