from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
    Form,
    Response,
)
from sqlalchemy.orm import Session
from fastapi import UploadFile, File
import json
import os
import uuid

from app.services.face_service import FaceService
from app.db.repositories import UserRepository
from app.schemas.auth import FaceVerificationResponse
from app.db.session import get_db
from app.schemas.auth import (
    AadhaarCompleteRegistrationRequest,
    AadhaarOTPVerifyRequest,
    AadhaarRegistrationRequest,
    CustomerLoginRequest,
    FaceVerificationResponse,
    EmailRegisterRequest,
    EmailRegisterResponse,
    EmailVerifyOTPRequest,
    MessageResponse,
    MobileCompleteRegistrationRequest,
    MobileSendOTPRequest,
    MobileSendOTPResponse,
    MobileVerifyOTPRequest,
    MobileVerifyOTPResponse,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import AuthService
from fastapi.security import OAuth2PasswordBearer
from app.core.security import decode_token
from fastapi import Request

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/customer/login", auto_error=False)

def get_current_customer(
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    if not token:
        token = request.cookies.get("access_token")
        
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    payload = decode_token(token)
    if not payload or payload.get("type") != "customer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        
    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user ID in token")
        
    user = UserRepository(db).get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return user

router = APIRouter(
    prefix="/customer",
    tags=["Customer Authentication"],
)


@router.post(
    "/register/email",
    response_model=EmailRegisterResponse,
)
def register_email(
    data: EmailRegisterRequest,
    db: Session = Depends(get_db),
):
    try:
        user, _ = AuthService(db).register_customer_email(data)

        return EmailRegisterResponse(
            message="Registration successful. Please verify your email with the OTP sent.",
            email=user.email,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.post(
    "/register/email/verify-otp",
    response_model=MessageResponse,
)
def verify_email_otp(
    data: EmailVerifyOTPRequest,
    db: Session = Depends(get_db),
):
    try:
        AuthService(db).verify_email_registration(
            data.email,
            data.otp_code,
        )

        return MessageResponse(
            message="Email verified successfully. You can now login."
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.post(
    "/register/mobile/send-otp",
    response_model=MobileSendOTPResponse,
)
def send_mobile_otp(
    data: MobileSendOTPRequest,
    db: Session = Depends(get_db),
):
    try:
        expires_in, otp_code, _ = (
            AuthService(db).send_mobile_registration_otp(
                data.mobile_number
            )
        )

        return MobileSendOTPResponse(
            message="OTP sent successfully.",
            mobile_number=data.mobile_number,
            expires_in_seconds=expires_in,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.post(
    "/register/mobile/verify-otp",
    response_model=MobileVerifyOTPResponse,
)
def verify_mobile_otp(
    data: MobileVerifyOTPRequest,
    db: Session = Depends(get_db),
):
    try:
        AuthService(db).verify_mobile_registration_otp(
            data.mobile_number,
            data.otp_code,
        )

        return MobileVerifyOTPResponse(
            message="Mobile number verified successfully.",
            mobile_number=data.mobile_number,
            verified=True,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.post(
    "/register/mobile/complete",
    response_model=UserResponse,
)
def complete_mobile_registration(
    data: MobileCompleteRegistrationRequest,
    db: Session = Depends(get_db),
):
    try:
        user = AuthService(db).complete_mobile_registration(data)

        return UserResponse(
            id=str(user.id),
            full_name=user.full_name,
            email=user.email,
            mobile_number=user.mobile_number,
            role=user.role.value,
            is_active=user.is_active,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


# =====================================================
# AADHAAR REGISTRATION FLOW
# =====================================================

@router.post("/aadhaar/send-otp")
def send_aadhaar_otp(
    data: AadhaarRegistrationRequest,
    db: Session = Depends(get_db),
):
    try:
        expires_in, otp_code, _ = (
            AuthService(db).send_aadhaar_registration_otp(
                data
            )
        )

        return {
            "message": "OTP sent successfully",
            "mobile_number": data.mobile_number,
            "expires_in_seconds": expires_in,
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.post("/aadhaar/verify-otp")
def verify_aadhaar_otp(
    data: AadhaarOTPVerifyRequest,
    db: Session = Depends(get_db),
):
    try:
        AuthService(db).verify_aadhaar_registration_otp(
            data.mobile_number,
            data.otp_code,
        )

        return {
            "message": "Aadhaar OTP verified successfully"
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.post(
    "/aadhaar/complete-registration",
    response_model=UserResponse,
)
def complete_aadhaar_registration(
    data: AadhaarCompleteRegistrationRequest,
    db: Session = Depends(get_db),
):
    try:
        user = AuthService(db).complete_aadhaar_registration(
            data
        )

        return UserResponse(
            id=str(user.id),
            full_name=user.full_name,
            email=user.email,
            mobile_number=user.mobile_number,
            role=user.role.value,
            is_active=user.is_active,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

@router.post("/aadhaar/enroll-face")
async def enroll_face(
    aadhaar_number: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):

    user = AuthService(db).user_repo.get_by_aadhaar(
        aadhaar_number
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    os.makedirs(
        "uploads/faces",
        exist_ok=True,
    )

    filename = (
        f"{uuid.uuid4()}_{file.filename}"
    )

    file_path = os.path.join(
        "uploads/faces",
        filename,
    )

    with open(file_path, "wb") as buffer:
        buffer.write(
            await file.read()
        )

    try:

        face_service = FaceService()

        embedding = face_service.extract_embedding(
            file_path
        )

        user.face_embedding = json.dumps(
            embedding
        )

        db.commit()

        return {
            "message": "Face enrolled successfully"
        }

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )
@router.post(
    "/aadhaar/verify-face",
    response_model=FaceVerificationResponse,
)
async def verify_face(
    aadhaar_number: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):

    user = AuthService(db).user_repo.get_by_aadhaar(
        aadhaar_number
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if not user.face_embedding:
        raise HTTPException(
            status_code=400,
            detail="Face not enrolled",
        )

    image_bytes = await file.read()

    face_service = FaceService()

    similarity = face_service.compare_with_stored_embedding(
        user.face_embedding,
        image_bytes,
    )

    threshold = 0.50

    return FaceVerificationResponse(
        verified=similarity >= threshold,
        similarity=round(similarity, 4),
        threshold=threshold,
    )

@router.post(
    "/login",
    response_model=TokenResponse,
)
def customer_login(
    data: CustomerLoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    try:
        token_data = AuthService(db).login_customer(data)
        response.set_cookie(
            key="access_token",
            value=token_data.access_token,
            httponly=True,
            secure=True,
            samesite="strict",
            max_age=30 * 60,
            path="/"
        )
        response.set_cookie(
            key="refresh_token",
            value=token_data.refresh_token,
            httponly=True,
            secure=True,
            samesite="strict",
            max_age=7 * 24 * 60 * 60,
            path="/"
        )
        return token_data

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc

@router.post("/logout")
def customer_logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out successfully"}