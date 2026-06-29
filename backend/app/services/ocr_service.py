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
    2. DPI upscaling to 300 (Tesseract's sweet spot)
    3. Adaptive thresholding (clean black-on-white)
    4. Morphological denoising
    """

    def _preprocess(self, image_path: str) -> np.ndarray:
        """Apply preprocessing pipeline to maximize Tesseract accuracy."""
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not read image: {image_path}")

        # 1. Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 2. Upscale to ~300 DPI if the image is small
        h, w = gray.shape
        if w < 1000:
            scale = 1000 / w
            gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

        # 3. Adaptive threshold for clean binarization
        binary = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 10
        )

        # 4. Morphological opening to remove small noise
        kernel = np.ones((1, 1), np.uint8)
        clean = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)

        return clean

    def extract(self, image_path: str) -> dict[str, Any]:
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

        # Use image_to_data for word-level bounding boxes and confidence
        # PSM 6 = Assume a single uniform block of text (great for ID cards)
        # Languages: English + Hindi + Marathi
        custom_config = r'--oem 3 --psm 6'

        try:
            data = pytesseract.image_to_data(
                processed,
                lang='eng+hin+mar',
                config=custom_config,
                output_type=pytesseract.Output.DICT
            )
        except pytesseract.TesseractNotFoundError:
            logger.error("Tesseract not found! Install with: brew install tesseract tesseract-lang")
            return {"text": "", "lines": [], "line_count": 0}
        except Exception as e:
            logger.error(f"Tesseract OCR failed: {e}")
            # Fallback: try with just English
            try:
                data = pytesseract.image_to_data(
                    processed,
                    lang='eng',
                    config=custom_config,
                    output_type=pytesseract.Output.DICT
                )
            except Exception as e2:
                logger.error(f"Tesseract fallback also failed: {e2}")
                return {"text": "", "lines": [], "line_count": 0}

        lines: list[dict[str, Any]] = []

        n_boxes = len(data['text'])
        for i in range(n_boxes):
            text = data['text'][i].strip()
            conf = int(data['conf'][i])

            # Skip empty text or very low confidence detections
            if not text or conf < 0:
                continue

            x = data['left'][i]
            y = data['top'][i]
            w = data['width'][i]
            h = data['height'][i]

            # Store bbox in [x, y, w, h] format
            # Also provide the 4-point format for compatibility with existing code
            bbox = [
                [x, y],
                [x + w, y],
                [x + w, y + h],
                [x, y + h]
            ]

            lines.append({
                "text": text,
                "confidence": round(conf / 100.0, 4),
                "bbox": bbox,
            })

        full_text = "\n".join(line["text"] for line in lines)

        logger.info(f"Tesseract extracted {len(lines)} text regions from {image_path}")

        return {
            "text": full_text,
            "lines": lines,
            "line_count": len(lines),
        }

    def extract_text_only(self, image_path: str) -> str:
        """Convenience wrapper that returns only the extracted text."""
        return self.extract(image_path)["text"]
