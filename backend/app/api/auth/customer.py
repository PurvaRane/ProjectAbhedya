from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import (
    CustomerLoginRequest,
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
from app.services.sms_service import SmsService

router = APIRouter(prefix="/customer", tags=["Customer Authentication"])


@router.post("/register/email", response_model=EmailRegisterResponse)
def register_email(data: EmailRegisterRequest, db: Session = Depends(get_db)):
    try:
        user, _ = AuthService(db).register_customer_email(data)
        return EmailRegisterResponse(
            message="Registration successful. Please verify your email with the OTP sent.",
            email=user.email,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/register/email/verify-otp", response_model=MessageResponse)
def verify_email_otp(data: EmailVerifyOTPRequest, db: Session = Depends(get_db)):
    try:
        AuthService(db).verify_email_registration(data.email, data.otp_code)
        return MessageResponse(message="Email verified successfully. You can now login.")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/register/mobile/send-otp", response_model=MobileSendOTPResponse)
def send_mobile_otp(data: MobileSendOTPRequest, db: Session = Depends(get_db)):
    try:
        expires_in, _, sms_delivered = AuthService(db).send_mobile_registration_otp(
            data.mobile_number
        )
        if not sms_delivered:
            sms = SmsService()
            if not sms.is_configured:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="SMS provider is not configured. Set Twilio credentials in backend .env",
                )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to send SMS. Verify Twilio phone number and recipient is verified (trial accounts).",
            )
        return MobileSendOTPResponse(
            message="OTP sent successfully to your mobile number.",
            mobile_number=data.mobile_number,
            expires_in_seconds=expires_in,
        )
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/register/mobile/verify-otp", response_model=MobileVerifyOTPResponse)
def verify_mobile_otp(data: MobileVerifyOTPRequest, db: Session = Depends(get_db)):
    try:
        AuthService(db).verify_mobile_registration_otp(data.mobile_number, data.otp_code)
        return MobileVerifyOTPResponse(
            message="Mobile number verified successfully.",
            mobile_number=data.mobile_number,
            verified=True,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/register/mobile/complete", response_model=UserResponse)
def complete_mobile_registration(
    data: MobileCompleteRegistrationRequest, db: Session = Depends(get_db)
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/login", response_model=TokenResponse)
def customer_login(data: CustomerLoginRequest, db: Session = Depends(get_db)):
    try:
        return AuthService(db).login_customer(data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
