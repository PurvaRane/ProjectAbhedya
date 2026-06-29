import logging
from pyhanko.pdf_utils.reader import PdfFileReader
from pyhanko.sign import validation

logger = logging.getLogger(__name__)

class DigitalSignatureService:
    def verify_pdf_signature(self, file_path: str) -> dict:
        """
        Validates the embedded digital signature (DSC) of a PDF.
        Returns a dictionary indicating if it's tampered and any reason.
        """
        try:
            with open(file_path, "rb") as f:
                reader = PdfFileReader(f)
                
                # Check if there are any signature fields
                if not reader.embedded_signatures:
                    return {
                        "is_signed": False,
                        "is_tampered": False,
                        "status": "No Signature Present"
                    }
                
                # A file might have multiple signatures; usually the last one covers the whole document
                sig = reader.embedded_signatures[-1]
                
                # Validate cryptographic integrity
                status = validation.validate_pdf_signature(sig)
                
                # "INTACT" means the document bytes match the mathematical signature exactly.
                # If someone opens a signed PDF and hits "Save" after editing, the signature breaks.
                if status.intact:
                    signer = "Unknown"
                    if getattr(status, 'signer_info', None) and getattr(status.signer_info, 'signer_cert', None):
                        signer = status.signer_info.signer_cert.subject.human_friendly
                        
                    logger.info(f"PDF Digital Signature Intact for {file_path}. Signer: {signer}")
                    return {
                        "is_signed": True,
                        "is_tampered": False,
                        "status": "Intact",
                        "signer_name": signer
                    }
                else:
                    logger.warning(f"PDF Digital Signature TAMPERED for {file_path}")
                    return {
                        "is_signed": True,
                        "is_tampered": True,
                        "status": "Tampered - Signature Bytes Mismatch"
                    }
                    
        except Exception as e:
            logger.error(f"Error checking PDF signature for {file_path}: {e}")
            return {
                "is_signed": False,
                "is_tampered": False,
                "status": f"Error: {str(e)}"
            }

dsc_service = DigitalSignatureService()
