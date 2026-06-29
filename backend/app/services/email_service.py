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
        # FOR 100% OFFLINE MODE: Bypass SMTP completely.
        # We just print the OTP to the console so the user/teller can see it.
        logger.info(f"\n======================================================\n[OFFLINE EMAIL SIMULATION] To: {email}\nOTP Code: {otp_code}\n======================================================\n")
        
        # We can also attempt to write it to a local file for easy retrieval
        try:
            with open("offline_otps.log", "a") as f:
                f.write(f"To: {email} | OTP: {otp_code}\n")
        except:
            pass
            
        return True
