import hashlib
import logging
import random
from datetime import datetime, timedelta, timezone

import redis
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.repositories import OTPRepository
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)


class OTPService:
    def __init__(self, db: Session):
        self.db = db
        self.settings = get_settings()
        self.otp_repo = OTPRepository(db)
        self.email_service = EmailService()
        self.redis_client = redis.from_url(
            self.settings.redis_url,
            decode_responses=True,
        )

    def _generate_otp(self) -> str:
        return str(random.randint(100000, 999999))

    def _hash_otp(self, otp: str) -> str:
        return hashlib.sha256(otp.encode()).hexdigest()

    def _rate_limit_key(self, identifier: str, channel: str) -> str:
        return f"otp_rate:{channel}:{identifier}"

    def _check_rate_limit(self, identifier: str, channel: str) -> bool:
        key = self._rate_limit_key(identifier, channel)

        if self.redis_client.get(key):
            return False

        self.redis_client.setex(
            key,
            self.settings.otp_rate_limit_seconds,
            "1",
        )

        return True

    def _expires_at(self) -> datetime:
        return (
            datetime.now(timezone.utc)
            + timedelta(minutes=self.settings.otp_expire_minutes)
        )

    def send_email_otp(self, email: str) -> tuple[str, int]:
        if not self._check_rate_limit(email.lower(), "email"):
            raise ValueError("Please wait before requesting another OTP")

        otp_code = self._generate_otp()
        otp_hash = self._hash_otp(otp_code)

        self.otp_repo.create(
            email=email,
            otp_code=otp_hash,
            expires_at=self._expires_at(),
        )

        self.email_service.send_otp_email(
            email,
            otp_code,
        )

        try:
            with open("offline_otps.log", "a") as f:
                f.write(f"{datetime.now().isoformat()} - Email OTP for {email}: {otp_code}\n")
        except Exception as e:
            logger.error(f"Failed to write offline OTP: {e}")

        logger.info("Email OTP sent to %s : %s", email, otp_code)

        return (
            otp_code,
            self.settings.otp_expire_minutes * 60,
        )

    def send_mobile_otp(self, mobile_number: str) -> tuple[str, int, bool]:
        if not self._check_rate_limit(mobile_number, "mobile"):
            raise ValueError("Please wait before requesting another OTP")

        otp_code = self._generate_otp()
        otp_hash = self._hash_otp(otp_code)

        self.otp_repo.create(
            mobile_number=mobile_number,
            otp_code=otp_hash,
            expires_at=self._expires_at(),
        )

        try:
            with open("offline_otps.log", "a") as f:
                f.write(f"{datetime.now().isoformat()} - Mobile OTP for +91{mobile_number}: {otp_code}\n")
        except Exception as e:
            logger.error(f"Failed to write offline OTP: {e}")

        logger.info(
            "DEMO OTP for +91%s : %s",
            mobile_number,
            otp_code,
        )

        return (
            otp_code,
            self.settings.otp_expire_minutes * 60,
            True,
        )

    def verify_email_otp(self, email: str, otp_code: str) -> bool:
        otp = self.otp_repo.get_latest_unverified(
            email=email,
        )

        entered_hash = self._hash_otp(otp_code)

        if not otp:
            return False

        if otp.otp_code != entered_hash:
            return False

        if self.otp_repo.is_expired(otp):
            return False

        self.otp_repo.mark_verified(otp)

        return True

    def verify_mobile_otp(
        self,
        mobile_number: str,
        otp_code: str,
    ) -> bool:
        otp = self.otp_repo.get_latest_unverified(
            mobile_number=mobile_number,
        )

        entered_hash = self._hash_otp(otp_code)

        if not otp:
            return False

        if otp.otp_code != entered_hash:
            return False

        if self.otp_repo.is_expired(otp):
            return False

        self.otp_repo.mark_verified(otp)

        self.redis_client.setex(
            f"mobile_verified:{mobile_number}",
            1800,
            "1",
        )

        return True

    def is_mobile_verified(self, mobile_number: str) -> bool:
        return bool(
            self.redis_client.get(
                f"mobile_verified:{mobile_number}"
            )
        )