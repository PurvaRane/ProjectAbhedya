import re
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.models import User, Document, DocumentAnalysis

logger = logging.getLogger(__name__)

class ValidationService:
    def __init__(self):
        # Tesseract confidence varies wildly on noise/multilingual text. 0.60 is a realistic baseline.
        self.MIN_OCR_CONFIDENCE = 0.60
        self.MIN_AGE = 18
        self.MAX_DEVICE_ACCOUNTS = 50

    @staticmethod
    def _get_value(entity):
        """Safely extract value from entity (handles both dict and string)."""
        if isinstance(entity, dict):
            return entity.get("value", "")
        return entity if entity else ""

    def run_all_rules(self, db: Session, user_id: str, ocr_results: dict, extracted_entities: dict, raw_text: str) -> dict:
        """
        Runs all business validation rules.
        Returns a dict with 'passed' (bool), 'needs_review' (bool), and 'details' (dict).
        """
        results = {
            "passed": True,
            "needs_review": False,
            "details": {}
        }
        
        # 1. OCR Confidence Check
        conf_result = self.check_ocr_confidence(ocr_results)
        results["details"]["ocr_confidence"] = conf_result
        if not conf_result["passed"]:
            results["passed"] = False

        # Extract DOB and Gender (if not already extracted by layout/pipeline)
        dob = self._extract_dob(raw_text)
        gender = self._extract_gender(raw_text)
        if dob:
            extracted_entities["dob"] = dob
        if gender:
            extracted_entities["gender"] = gender

        # 2. Mandatory Field Validation
        mand_result = self.validate_mandatory_fields(extracted_entities, raw_text)
        results["details"]["mandatory_fields"] = mand_result
        if not mand_result["passed"]:
            results["passed"] = False
            
        # 3. Format Validation
        fmt_result = self.validate_format(extracted_entities)
        results["details"]["format_validation"] = fmt_result
        if not fmt_result["passed"]:
            results["passed"] = False

        # 4. Date Validation (Age & Expiry)
        date_result = self.validate_dates(extracted_entities)
        results["details"]["date_validation"] = date_result
        if not date_result["passed"]:
            results["passed"] = False

        # 5. Cross-Field Consistency (DB Check)
        cross_result = self.check_cross_field_consistency(db, user_id, extracted_entities)
        results["details"]["cross_field_consistency"] = cross_result
        if not cross_result["passed"]:
            results["passed"] = False
            results["needs_review"] = True # Anomaly across documents

        # 6. Duplicate Detection (DB Check)
        dup_result = self.check_duplicates(db, user_id, extracted_entities)
        results["details"]["duplicate_detection"] = dup_result
        if not dup_result["passed"]:
            results["passed"] = False
            results["needs_review"] = True

        # 7. Device Rule (DB Check)
        dev_result = self.check_device_rule(db, user_id)
        results["details"]["device_rule"] = dev_result
        if not dev_result["passed"]:
            results["passed"] = False
            results["needs_review"] = True

        return results

    def _extract_dob(self, text: str) -> str | None:
        # Looking for dd/mm/yyyy or dd-mm-yyyy
        match = re.search(r'\b(\d{2}[/-]\d{2}[/-]\d{4})\b', text)
        return match.group(1) if match else None

    def _extract_gender(self, text: str) -> str | None:
        text_upper = text.upper()
        if "MALE" in text_upper and "FEMALE" not in text_upper:
            return "MALE"
        if "FEMALE" in text_upper:
            return "FEMALE"
        if "TRANSGENDER" in text_upper:
            return "TRANSGENDER"
        return None

    def check_ocr_confidence(self, ocr_results: dict) -> dict:
        lines = ocr_results.get("lines", [])
        if not lines:
            return {"passed": False, "reason": "No text detected."}
        
        avg_conf = sum(line["confidence"] for line in lines) / len(lines)
        passed = avg_conf >= self.MIN_OCR_CONFIDENCE
        return {
            "passed": passed, 
            "score": round(avg_conf, 4),
            "reason": f"Average confidence is {avg_conf:.2f}" if passed else f"Confidence {avg_conf:.2f} is below {self.MIN_OCR_CONFIDENCE}"
        }

    def validate_mandatory_fields(self, entities: dict, raw_text: str) -> dict:
        missing = []
        is_aadhaar = "aadhaar" in entities or "GOVERNMENT OF INDIA" in raw_text.upper()
        is_pan = "pan" in entities or "INCOME TAX DEPARTMENT" in raw_text.upper()

        if is_aadhaar:
            if "aadhaar" not in entities: missing.append("Aadhaar Number")
            if "dob" not in entities and "YEAR OF BIRTH" not in raw_text.upper(): missing.append("DOB")
            if "gender" not in entities: missing.append("Gender")
            
        elif is_pan:
            if "pan" not in entities: missing.append("PAN Number")
            if "dob" not in entities: missing.append("DOB")
            
        if missing:
            return {"passed": False, "missing_fields": missing, "reason": f"Missing mandatory fields: {', '.join(missing)}"}
        return {"passed": True, "reason": "All mandatory fields present."}

    def validate_format(self, entities: dict) -> dict:
        errors = []
        
        if "aadhaar" in entities:
            # Must be exactly 12 digits
            val = entities["aadhaar"].get("value", "") if isinstance(entities["aadhaar"], dict) else entities["aadhaar"]
            if not re.match(r'^\d{12}$', val):
                errors.append("Invalid Aadhaar format.")
                
        if "pan" in entities:
            # 5 letters, 4 numbers, 1 letter
            val = entities["pan"].get("value", "") if isinstance(entities["pan"], dict) else entities["pan"]
            if not re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]$', val):
                errors.append("Invalid PAN format.")

        if errors:
            return {"passed": False, "reason": " | ".join(errors)}
        return {"passed": True, "reason": "Format checks passed."}

    def validate_dates(self, entities: dict) -> dict:
        dob_raw = entities.get("dob")
        dob_str = self._get_value(dob_raw)
        if dob_str:
            try:
                # Parse dd/mm/yyyy or dd-mm-yyyy
                dob_str = dob_str.replace('-', '/')
                dob = datetime.strptime(dob_str, "%d/%m/%Y")
                age = (datetime.now() - dob).days / 365.25
                if age < self.MIN_AGE:
                    return {"passed": False, "reason": f"Age is {int(age)}, which is below minimum {self.MIN_AGE}."}
                if age > 120:
                    return {"passed": False, "reason": f"Age is suspiciously high ({int(age)})."}
            except ValueError:
                return {"passed": False, "reason": "DOB format is invalid or unparseable."}
                
        return {"passed": True, "reason": "Date validations passed."}

    def check_cross_field_consistency(self, db: Session, user_id: str, current_entities: dict) -> dict:
        """Checks if current extracted DOB matches previously extracted DOB for this user."""
        current_dob = self._get_value(current_entities.get("dob"))
        if not current_dob:
            return {"passed": True, "reason": "No DOB to cross-check."}

        # Find previous successful documents for this user
        prev_docs = db.query(DocumentAnalysis).join(Document, DocumentAnalysis.document_id == Document.id).filter(Document.user_id == user_id).all()
        
        for doc in prev_docs:
            if doc.forgery_features:
                import json
                try:
                    features = json.loads(doc.forgery_features)
                    prev_entities = features.get("extracted_entities", {})
                    prev_dob = self._get_value(prev_entities.get("dob"))
                    
                    if prev_dob and prev_dob != current_dob:
                        return {
                            "passed": False, 
                            "reason": f"Cross-field mismatch: Current DOB ({current_dob}) does not match previously extracted DOB ({prev_dob})."
                        }
                except:
                    pass
                    
        return {"passed": True, "reason": "Cross-field consistency passed."}

    def check_duplicates(self, db: Session, user_id: str, entities: dict) -> dict:
        aadhaar = self._get_value(entities.get("aadhaar"))
        pan = self._get_value(entities.get("pan"))
        
        if aadhaar:
            existing = db.query(User).filter(User.aadhaar_number == aadhaar, User.id != user_id).first()
            if existing:
                return {"passed": False, "reason": "Aadhaar number already registered to another account."}
                
        if pan:
            existing = db.query(User).filter(User.pan_number == pan, User.id != user_id).first()
            if existing:
                return {"passed": False, "reason": "PAN number already registered to another account."}

        return {"passed": True, "reason": "No duplicate identities found."}

    def check_device_rule(self, db: Session, user_id: str) -> dict:
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.last_device_id:
            return {"passed": True, "reason": "No device tracking data available."}
            
        device_count = db.query(func.count(User.id)).filter(User.last_device_id == user.last_device_id).scalar()
        
        if device_count > self.MAX_DEVICE_ACCOUNTS:
            return {
                "passed": False, 
                "reason": f"Device Rule Violation: {device_count} accounts created from this device (Max {self.MAX_DEVICE_ACCOUNTS})."
            }
            
        return {"passed": True, "reason": f"Device rule passed ({device_count} accounts)."}

validation_service = ValidationService()
