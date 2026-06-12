import logging
import random
import smtplib
from email.mime.text import MIMEText

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.settings = get_settings()

    def send_otp_email(self, email: str, otp_code: str) -> bool:
        subject = "VeriTrust - Email Verification OTP"
        body = (
            f"Your VeriTrust verification OTP is: {otp_code}\n\n"
            f"This OTP is valid for {self.settings.otp_expire_minutes} minutes.\n\n"
            "Do not share this OTP with anyone.\n\n"
            "— VeriTrust Team"
        )

        if not self.settings.smtp_user or not self.settings.smtp_password:
            logger.info("SMTP not configured. OTP for %s: %s", email, otp_code)
            return True

        try:
            msg = MIMEText(body)
            msg["Subject"] = subject
            msg["From"] = self.settings.smtp_from
            msg["To"] = email

            with smtplib.SMTP(self.settings.smtp_host, self.settings.smtp_port) as server:
                server.starttls()
                server.login(self.settings.smtp_user, self.settings.smtp_password)
                server.send_message(msg)
            logger.info("Email OTP delivered to %s", email)
            return True
        except Exception:
            logger.exception("Failed to send email to %s", email)
            logger.info("Fallback OTP for %s: %s", email, otp_code)
            return True
