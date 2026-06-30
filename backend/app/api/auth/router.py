from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import decode_token, create_access_token
from pydantic import BaseModel

from app.api.auth.customer import router as customer_router
from app.api.auth.employee import router as employee_router

router = APIRouter(prefix="/auth")
router.include_router(customer_router)
router.include_router(employee_router)

class TokenRefreshRequest(BaseModel):
    refresh_token: Optional[str] = None

class TokenRefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/refresh", response_model=TokenRefreshResponse)
def refresh_token(request: Request, response: Response, body: Optional[TokenRefreshRequest] = None, db: Session = Depends(get_db)):
    refresh_token = body.refresh_token if body and body.refresh_token else request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing refresh token")
        
    payload = decode_token(refresh_token)
    if not payload or payload.get("token_type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    
    actor_type = payload.get("type")
    user_id = payload.get("sub")
    if not actor_type or not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        
    if actor_type == "customer":
        from app.db.repositories import UserRepository
        import uuid
        user = UserRepository(db).get_by_id(uuid.UUID(user_id))
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not active")
        new_token = create_access_token(subject=str(user.id), role=user.role.value, actor_type="customer")
    elif actor_type == "employee":
        from app.db.repositories import EmployeeRepository
        import uuid
        emp = EmployeeRepository(db).get_by_id(uuid.UUID(user_id))
        if not emp or not emp.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Employee not active")
        new_token = create_access_token(subject=str(emp.id), role=emp.role.value, actor_type="employee")
    else:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown actor type")
        
    response.set_cookie(
        key="access_token",
        value=new_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=30*60,
        path="/"
    )
    return TokenRefreshResponse(access_token=new_token)
