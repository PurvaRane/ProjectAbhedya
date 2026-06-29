import logging

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class SmsService:
    FAST2SMS_BULK_URL = "https://www.fast2sms.com/dev/bulkV2"
    FAST2SMS_OTP_URL = "https://www.fast2sms.com/dev/otp/send"

    def __init__(self):
        self.settings = get_settings()

    @property
    def twilio_configured(self) -> bool:
        return bool(
            self.settings.twilio_account_sid
            and self.settings.twilio_auth_token
            and self.settings.twilio_phone_number
        )

    @property
    def fast2sms_configured(self) -> bool:
        return bool(self.settings.fast2sms_api_key)

    @property
    def is_configured(self) -> bool:
        return self.twilio_configured or self.fast2sms_configured

    def send_otp_sms(self, mobile_number: str, otp_code: str) -> bool:
        # FOR 100% OFFLINE MODE: Bypass Twilio and Fast2SMS completely.
        # We just print the OTP to the console so the user/teller can see it.
        logger.info(f"\n======================================================\n[OFFLINE SMS SIMULATION] To: +91{mobile_number}\nOTP Code: {otp_code}\n======================================================\n")
        
        # We can also attempt to write it to a local file for easy retrieval
        try:
            with open("offline_otps.log", "a") as f:
                f.write(f"To: +91{mobile_number} | OTP: {otp_code}\n")
        except:
            pass
            
        return True

    def _format_e164(self, mobile_number: str) -> str:
        digits = mobile_number.strip()
        if digits.startswith("+"):
            return digits
        if len(digits) == 10:
            return f"+91{digits}"
        return f"+{digits}"

    def _twilio_from_number(self) -> str:
        number = self.settings.twilio_phone_number.strip()
        if not number.startswith("+"):
            raise ValueError(
                "TWILIO_PHONE_NUMBER must be your Twilio number in E.164 format (e.g. +14155552671). "
                "Get it from Twilio Console → Phone Numbers."
            )
        return number

    def _send_via_twilio(self, mobile_number: str, otp_code: str) -> bool:
        try:
            from twilio.rest import Client

            from_number = self._twilio_from_number()
            client = Client(
                self.settings.twilio_account_sid,
                self.settings.twilio_auth_token,
            )
            message_body = (
                f"Your VeriTrust verification OTP is {otp_code}. "
                f"Valid for {self.settings.otp_expire_minutes} minutes. Do not share."
            )
            message = client.messages.create(
                body=message_body,
                from_=from_number,
                to=self._format_e164(mobile_number),
            )
            logger.info(
                "SMS OTP delivered to +91%s via Twilio (SID: %s)",
                mobile_number,
                message.sid,
            )
            return True
        except ValueError as exc:
            logger.error("Twilio config error: %s", exc)
        except Exception as exc:
            if exc.__class__.__name__ == "TwilioRestException":
                logger.error("Twilio SMS failed for +91%s: %s", mobile_number, exc)
            else:
                logger.exception("Twilio SMS error for +91%s", mobile_number)
        return False

    def _send_via_fast2sms(self, mobile_number: str, otp_code: str) -> bool:
        if self.settings.fast2sms_otp_id and self._send_fast2sms_otp_api(mobile_number, otp_code):
            return True
        if self._send_fast2sms_bulk_otp(mobile_number, otp_code):
            return True
        return self._send_fast2sms_quick_sms(mobile_number, otp_code)

    def _fast2sms_headers(self) -> dict[str, str]:
        return {"authorization": self.settings.fast2sms_api_key}

    def _send_fast2sms_otp_api(self, mobile_number: str, otp_code: str) -> bool:
        payload = {
            "mobile": mobile_number,
            "otp_id": self.settings.fast2sms_otp_id,
            "otp": otp_code,
            "otp_expiry": self.settings.otp_expire_minutes,
            "otp_length": len(otp_code),
        }
        try:
            response = httpx.post(
                self.FAST2SMS_OTP_URL,
                headers={**self._fast2sms_headers(), "Content-Type": "application/json"},
                json=payload,
                timeout=15.0,
            )
            data = response.json()
            if response.status_code == 200 and data.get("return") is True:
                logger.info("SMS OTP delivered to +91%s via Fast2SMS OTP API", mobile_number)
                return True
            logger.warning("Fast2SMS OTP API failed for +91%s: %s", mobile_number, data)
        except Exception:
            logger.exception("Fast2SMS OTP API error for +91%s", mobile_number)
        return False

    def _send_fast2sms_bulk_otp(self, mobile_number: str, otp_code: str) -> bool:
        payload = {
            "route": "otp",
            "variables_values": otp_code,
            "numbers": mobile_number,
        }
        return self._post_fast2sms_bulk(payload, mobile_number, "OTP route")

    def _send_fast2sms_quick_sms(self, mobile_number: str, otp_code: str) -> bool:
        message = (
            f"Your VeriTrust verification OTP is {otp_code}. "
            f"Valid for {self.settings.otp_expire_minutes} minutes. Do not share."
        )
        payload = {
            "route": "q",
            "message": message,
            "language": "english",
            "numbers": mobile_number,
        }
        return self._post_fast2sms_bulk(payload, mobile_number, "Quick SMS route")

    def _post_fast2sms_bulk(self, payload: dict, mobile_number: str, route_name: str) -> bool:
        try:
            response = httpx.post(
                self.FAST2SMS_BULK_URL,
                headers=self._fast2sms_headers(),
                data=payload,
                timeout=15.0,
            )
            data = response.json()
            if response.status_code == 200 and data.get("return") is True:
                logger.info("SMS delivered to +91%s via Fast2SMS %s", mobile_number, route_name)
                return True
            logger.warning("Fast2SMS %s failed for +91%s: %s", route_name, mobile_number, data)
        except Exception:
            logger.exception("Fast2SMS %s error for +91%s", route_name, mobile_number)
        return False
