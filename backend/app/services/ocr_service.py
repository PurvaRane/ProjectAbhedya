import os
import cv2
import numpy as np
import pytesseract
import logging
from typing import Any

logger = logging.getLogger(__name__)


class OCRService:
    """Document OCR service powered by Google Tesseract (v5).

    Uses pytesseract which calls the Tesseract binary via subprocess.
    This is 100% crash-safe on macOS because Tesseract runs as a separate
    OS process and never shares C++ threads with PyTorch.

    Includes an image preprocessing pipeline to maximize accuracy:
    1. Grayscale conversion
    2. DPI upscaling to 300 (Tesseract's sweet spot) with max bounds check
    3. Adaptive thresholding (clean black-on-white)
    """

    def _preprocess(self, image_path: str) -> np.ndarray:
        """Apply preprocessing pipeline to maximize Tesseract accuracy."""
        # Use np.fromfile to handle non-ASCII paths properly
        try:
            file_bytes = np.fromfile(image_path, dtype=np.uint8)
            img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        except Exception as e:
            raise ValueError(f"Failed to read image at {image_path}: {e}")

        if img is None:
            raise ValueError(f"Could not decode image: {image_path}")

        # 1. Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 2. Upscale to ~1000px if the image is small, but cap at 4096px
        h, w = gray.shape
        if w < 1000:
            scale = 1000 / w
            gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
        elif w > 4096:
            scale = 4096 / w
            gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)

        # 3. Adaptive threshold for clean binarization
        binary = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 10
        )

        return binary

    def extract(self, image_path: str, lang: str = 'eng+hin+mar', psm: int = 6, timeout: int = 30) -> dict[str, Any]:
        """Run OCR on an image file and return structured results.

        Returns:
            A dict with keys:
                - ``text``        : full extracted text (newline-joined)
                - ``lines``       : list of per-line dicts with ``text``,
                                    ``confidence``, and ``bbox``
                - ``line_count``  : total number of detected text lines
        """
        logger.info(f"Extracting OCR using Tesseract for {image_path}...")

        try:
            processed = self._preprocess(image_path)
        except Exception as e:
            logger.error(f"Preprocessing failed for {image_path}: {e}")
            return {"text": "", "lines": [], "line_count": 0}

        custom_config = f'--oem 3 --psm {psm}'
        
        # Prevent CPU thrashing by limiting Tesseract threads
        os.environ['OMP_THREAD_LIMIT'] = '1'

        try:
            data = pytesseract.image_to_data(
                processed,
                lang=lang,
                config=custom_config,
                output_type=pytesseract.Output.DICT,
                timeout=timeout
            )
        except pytesseract.TesseractNotFoundError:
            logger.error("Tesseract not found! Install with: brew install tesseract tesseract-lang")
            return {"text": "", "lines": [], "line_count": 0}
        except RuntimeError as e:
             if 'timeout' in str(e).lower():
                 logger.error(f"Tesseract OCR timed out after {timeout} seconds for {image_path}")
             else:
                 logger.error(f"Tesseract OCR failed: {e}")
             return {"text": "", "lines": [], "line_count": 0}
        except Exception as e:
            logger.error(f"Tesseract OCR failed: {e}")
            if lang != 'eng':
                logger.info("Falling back to English OCR...")
                try:
                    data = pytesseract.image_to_data(
                        processed,
                        lang='eng',
                        config=custom_config,
                        output_type=pytesseract.Output.DICT,
                        timeout=timeout
                    )
                except Exception as e2:
                    logger.error(f"Tesseract fallback also failed: {e2}")
                    return {"text": "", "lines": [], "line_count": 0}
            else:
                return {"text": "", "lines": [], "line_count": 0}

        # Group words into lines
        # Tesseract outputs hierarchy: page_num -> block_num -> par_num -> line_num -> word_num
        line_groups: dict[tuple, list[dict]] = {}

        n_boxes = len(data['level'])
        for i in range(n_boxes):
            level = data['level'][i]
            
            # Level 5 corresponds to word level. Only words have actual text string in dict output.
            if level == 5:
                text = data['text'][i].strip()
                conf = int(data['conf'][i])
                
                if not text or conf < 0:
                    continue
                    
                key = (data['page_num'][i], data['block_num'][i], data['par_num'][i], data['line_num'][i])
                
                x = data['left'][i]
                y = data['top'][i]
                w = data['width'][i]
                h = data['height'][i]
                
                if key not in line_groups:
                    line_groups[key] = []
                    
                line_groups[key].append({
                    "text": text,
                    "conf": conf,
                    "left": x,
                    "top": y,
                    "right": x + w,
                    "bottom": y + h
                })

        lines: list[dict[str, Any]] = []
        
        for key, words in line_groups.items():
            if not words:
                continue
                
            line_text = " ".join([w['text'] for w in words])
            
            # Weighted confidence by string length
            total_len = sum(len(w['text']) for w in words)
            if total_len > 0:
                avg_conf = sum((w['conf'] * len(w['text'])) for w in words) / total_len
            else:
                avg_conf = sum(w['conf'] for w in words) / len(words)
                
            min_x = min(w['left'] for w in words)
            min_y = min(w['top'] for w in words)
            max_x = max(w['right'] for w in words)
            max_y = max(w['bottom'] for w in words)
            
            bbox = [
                [min_x, min_y],
                [max_x, min_y],
                [max_x, max_y],
                [min_x, max_y]
            ]
            
            lines.append({
                "text": line_text,
                "confidence": round(avg_conf / 100.0, 4),
                "bbox": bbox
            })

        full_text = "\n".join(line["text"] for line in lines)

        logger.info(f"Tesseract extracted {len(lines)} text lines from {image_path}")

        return {
            "text": full_text,
            "lines": lines,
            "line_count": len(lines),
        }

    def extract_text_only(self, image_path: str, lang: str = 'eng+hin+mar', psm: int = 6) -> str:
        """Convenience wrapper that returns only the extracted text."""
        return self.extract(image_path, lang=lang, psm=psm)["text"]
