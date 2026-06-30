from functools import lru_cache
from typing import List

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    app_name: str = "VeriTrust"
    app_env: str = "development"
    debug: bool = True

    database_url: str = "postgresql://veritrust:veritrust_secret@localhost:5432/veritrust_db"
    redis_url: str = "redis://localhost:6379/0"

    jwt_secret_key: str = "change-this-to-a-long-random-secret-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    otp_expire_minutes: int = 5
    otp_rate_limit_seconds: int = 60

    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "noreply@veritrust.in"

    # SMS - Twilio (free trial: https://www.twilio.com/try-twilio)
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""

    # SMS - Fast2SMS fallback (https://www.fast2sms.com)
    fast2sms_api_key: str = ""
    fast2sms_otp_id: str = ""

    cors_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:3000,http://192.168.1.5:5173"

    @field_validator("smtp_user", "smtp_password", "smtp_from", mode="before")
    @classmethod
    def strip_smtp_fields(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().replace(" ", "")
        return v

    @field_validator("fast2sms_api_key", "fast2sms_otp_id", mode="before")
    @classmethod
    def strip_sms_fields(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator(
        "twilio_account_sid", "twilio_auth_token", "twilio_phone_number", mode="before"
    )
    @classmethod
    def strip_twilio_fields(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip()
        return v

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_development(self) -> bool:
        return self.app_env.lower() in ("development", "dev", "local")

    @model_validator(mode="after")
    def validate_jwt_secret(self) -> 'Settings':
        if self.jwt_secret_key.startswith("change-this") and not self.is_development:
            raise RuntimeError("Insecure JWT secret key in production. Must be changed.")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
