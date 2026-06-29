import hashlib
import hmac
import random
import time
from app.core.config import get_settings

settings = get_settings()

class CaptchaService:
    """
    Offline stateless Math CAPTCHA service.
    Generates a simple math problem and a cryptographic token representing the answer.
    """
    
    @staticmethod
    def generate_captcha():
        a = random.randint(1, 10)
        b = random.randint(1, 10)
        operator = random.choice(["+", "-"])
        
        if operator == "+":
            answer = str(a + b)
            question = f"What is {a} + {b}?"
        else:
            # Ensure positive answers
            if a < b:
                a, b = b, a
            answer = str(a - b)
            question = f"What is {a} - {b}?"
            
        # Create a stateless token valid for 5 minutes
        timestamp = int(time.time())
        data = f"{answer}:{timestamp}"
        
        signature = hmac.new(
            settings.jwt_secret_key.encode(),
            data.encode(),
            hashlib.sha256
        ).hexdigest()
        
        token = f"{data}:{signature}"
        
        return {
            "question": question,
            "token": token
        }
        
    @staticmethod
    def verify_captcha(token: str, user_answer: str) -> bool:
        try:
            parts = token.split(":")
            if len(parts) != 3:
                return False
                
            original_answer, timestamp_str, signature = parts
            timestamp = int(timestamp_str)
            
            # Check expiration (5 minutes)
            if int(time.time()) - timestamp > 300:
                return False
                
            # Check answer
            if original_answer != user_answer.strip():
                return False
                
            # Verify signature
            data = f"{original_answer}:{timestamp_str}"
            expected_signature = hmac.new(
                settings.jwt_secret_key.encode(),
                data.encode(),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(signature, expected_signature)
        except Exception:
            return False
