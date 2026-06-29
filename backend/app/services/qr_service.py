import cv2
import zlib
import xml.etree.ElementTree as ET
import numpy as np
import logging

logger = logging.getLogger(__name__)

class QRService:
    def __init__(self):
        self.detector = cv2.QRCodeDetector()
        
    def extract_qr_data(self, image_path: str) -> dict | None:
        """
        Scans the image for a QR code, decodes it, and decompresses it if it's an Aadhaar Secure QR.
        Returns a dictionary of parsed data if successful, otherwise None.
        """
        try:
            img = cv2.imread(image_path)
            if img is None:
                return None
                
            data, bbox, _ = self.detector.detectAndDecode(img)
            
            if not data:
                return None
                
            logger.info("QR Code detected successfully!")
            
            try:
                # Modern Aadhaar Offline XML format
                if "PrintLetterBarcodeData" in data or data.startswith("<?xml"):
                    return self._parse_xml(data)
                
                # Older formats or highly compressed formats
                try:
                    # Attempt zlib decompression
                    compressed_bytes = data.encode('latin1')
                    decompressed = zlib.decompress(compressed_bytes, 16 + zlib.MAX_WBITS)
                    decoded_str = decompressed.decode('utf-8')
                    if "PrintLetterBarcodeData" in decoded_str or decoded_str.startswith("<?xml"):
                        return self._parse_xml(decoded_str)
                    return {"raw_data": decoded_str}
                except Exception:
                    # Not compressed, just standard text or JSON
                    return {"raw_data": data}
                    
            except Exception as e:
                logger.debug(f"QR parsing fallback: {e}")
                return {"raw_data": data}
                
        except Exception as e:
            logger.error(f"Error extracting QR Code: {e}")
            return None
            
    def _parse_xml(self, xml_string: str) -> dict:
        """Parses Aadhaar XML into a dictionary."""
        try:
            # Clean up XML string if it has trailing garbage
            end_idx = xml_string.rfind('>')
            if end_idx != -1:
                xml_string = xml_string[:end_idx+1]
                
            root = ET.fromstring(xml_string)
            data = {}
            for key, value in root.attrib.items():
                data[key.lower()] = value
            return data
        except Exception as e:
            logger.debug(f"XML parsing failed: {e}")
            return {"raw_xml": xml_string}

qr_service = QRService()
