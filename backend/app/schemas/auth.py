import re
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from app.core.security import validate_pan_format, validate_password_strength

def validate_aadhaar(aadhaar: str) -> str:
    aadhaar = aadhaar.strip()

    if not aadhaar.isdigit():
        raise ValueError("Aadhaar must contain only digits")

    if len(aadhaar) != 12:
        raise ValueError("Aadhaar must be exactly 12 digits")

    return aadhaar

class PasswordMixin:
    password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not validate_password_strength(v):
            raise ValueError(
                "Password must be at least 8 characters and contain uppercase, "
                "lowercase, number, and special character"
            )
        return v

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class EmailRegisterRequest(PasswordMixin, BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr

    @field_validator("full_name")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        return v.strip()


class EmailRegisterResponse(BaseModel):
    message: str
    email: str


class EmailVerifyOTPRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=4, max_length=10)


class MobileSendOTPRequest(BaseModel):
    mobile_number: str = Field(..., min_length=10, max_length=15)

    @field_validator("mobile_number")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v.strip())
        if len(digits) == 12 and digits.startswith("91"):
            digits = digits[2:]
        if len(digits) != 10 or not digits.isdigit():
            raise ValueError("Mobile number must be a valid 10-digit Indian number")
        return digits


class MobileSendOTPResponse(BaseModel):
    message: str
    mobile_number: str
    expires_in_seconds: int


class MobileVerifyOTPRequest(BaseModel):
    mobile_number: str
    otp_code: str = Field(..., min_length=4, max_length=10)

    @field_validator("mobile_number")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v.strip())
        if len(digits) == 12 and digits.startswith("91"):
            digits = digits[2:]
        return digits

class AadhaarRegistrationRequest(BaseModel):
    aadhaar_number: str
    mobile_number: str

    @field_validator("aadhaar_number")
    @classmethod
    def validate_aadhaar_number(cls, v: str) -> str:
        return validate_aadhaar(v)

    @field_validator("mobile_number")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v.strip())

        if len(digits) == 12 and digits.startswith("91"):
            digits = digits[2:]

        if len(digits) != 10:
            raise ValueError("Invalid mobile number")

        return digits


class AadhaarOTPVerifyRequest(BaseModel):
    aadhaar_number: str
    mobile_number: str
    otp_code: str = Field(..., min_length=6, max_length=6)

    @field_validator("aadhaar_number")
    @classmethod
    def validate_aadhaar_number(cls, v: str) -> str:
        return validate_aadhaar(v)

    @field_validator("mobile_number")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v.strip())

        if len(digits) == 12 and digits.startswith("91"):
            digits = digits[2:]

        if len(digits) != 10:
            raise ValueError(
                "Mobile number must be a valid 10-digit Indian number"
            )

        return digits

class AadhaarCompleteRegistrationRequest(PasswordMixin, BaseModel):
    aadhaar_number: str
    mobile_number: str
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    pan_number: str = Field(..., min_length=10, max_length=10)

    @field_validator("aadhaar_number")
    @classmethod
    def validate_aadhaar_number(cls, v: str) -> str:
        return validate_aadhaar(v)

    @field_validator("mobile_number")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v.strip())

        if len(digits) == 12 and digits.startswith("91"):
            digits = digits[2:]

        if len(digits) != 10:
            raise ValueError("Invalid mobile number")

        return digits

    @field_validator("pan_number")
    @classmethod
    def validate_pan(cls, v: str) -> str:
        pan = v.strip().upper()

        if not validate_pan_format(pan):
            raise ValueError(
                "Invalid PAN format. Expected format: ABCDE1234F"
            )

        return pan

    @field_validator("full_name")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        return v.strip()

class AadhaarLoginRequest(BaseModel):
    aadhaar_number: str

    @field_validator("aadhaar_number")
    @classmethod
    def validate_aadhaar_number(cls, v: str) -> str:
        return validate_aadhaar(v)

class MobileVerifyOTPResponse(BaseModel):
    message: str
    mobile_number: str
    verified: bool

class FaceVerificationResponse(BaseModel):
    verified: bool
    similarity: float
    threshold: float

class MobileCompleteRegistrationRequest(PasswordMixin, BaseModel):
    mobile_number: str
    full_name: str = Field(..., min_length=2, max_length=255)
    pan_number: str = Field(..., min_length=10, max_length=10)
    email: EmailStr

    @field_validator("mobile_number")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v.strip())
        if len(digits) == 12 and digits.startswith("91"):
            digits = digits[2:]
        return digits

    @field_validator("pan_number")
    @classmethod
    def validate_pan(cls, v: str) -> str:
        pan = v.strip().upper()
        if not validate_pan_format(pan):
            raise ValueError("Invalid PAN format. Expected format: ABCDE1234F")
        return pan

    @field_validator("full_name")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        return v.strip()


class CustomerLoginRequest(BaseModel):
    identifier: str = Field(..., description="Email or mobile number")
    password: str

    @field_validator("identifier")
    @classmethod
    def sanitize_identifier(cls, v: str) -> str:
        return v.strip()


class EmployeeLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    actor_type: Literal["customer", "employee"]


class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    mobile_number: Optional[str] = None
    role: str
    is_active: bool

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    message: str
