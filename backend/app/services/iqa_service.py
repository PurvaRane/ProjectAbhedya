import cv2
import numpy as np
import logging

logger = logging.getLogger(__name__)

class ImageQualityService:
    def __init__(self):
        # Thresholds
        self.BLUR_THRESHOLD = 10.0  # Lowered from 50.0 to allow standard camera scans
        self.GLARE_THRESHOLD = 95.0  # Increased to 95% to allow bright test documents
        self.MIN_RESOLUTION = (500, 500) # Minimum width x height
        self.DARKNESS_THRESHOLD = 40.0 # If average pixel intensity < 40, it's too dark
        self.CROP_MARGIN_PX = 5 # Pixels from the edge to trigger a crop warning
        
    def assess_quality(self, file_path: str) -> dict:
        """
        Mathematically assesses the physical quality of the image before running heavy AI.
        Returns {"is_acceptable": bool, "blur_score": float, "glare_score": float, "reason": str}
        """
        try:
            # Read image using OpenCV
            img = cv2.imread(file_path)
            if img is None:
                return {
                    "is_acceptable": False,
                    "blur_score": 0.0,
                    "glare_score": 0.0,
                    "brightness_score": 0.0,
                    "reason": "Unreadable image format or file corrupted."
                }
            
            height, width = img.shape[:2]
            
            # Convert to grayscale for mathematical analysis
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # 1. Blur Detection (Variance of the Laplacian)
            blur_variance = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            # 2. Glare Detection (Saturated pixels)
            # Count pixels that are almost pure white (intensity > 245)
            total_pixels = gray.shape[0] * gray.shape[1]
            saturated_pixels = np.sum(gray > 245)
            glare_percentage = (saturated_pixels / total_pixels) * 100
            
            # 3. Resolution Check
            if width < self.MIN_RESOLUTION[0] or height < self.MIN_RESOLUTION[1]:
                return {
                    "is_acceptable": False,
                    "blur_score": 0.0,
                    "glare_score": 0.0,
                    "brightness_score": 0.0,
                    "reason": f"Image resolution ({width}x{height}) is too low. Minimum is {self.MIN_RESOLUTION[0]}x{self.MIN_RESOLUTION[1]}."
                }
                
            # 4. Darkness/Exposure Check
            avg_brightness = np.mean(gray)
            
            is_acceptable = True
            reason = "Image quality is acceptable."
            
            if blur_variance < self.BLUR_THRESHOLD:
                is_acceptable = False
                reason = "Image is too blurry. Text extraction will fail."
            elif glare_percentage > self.GLARE_THRESHOLD:
                is_acceptable = False
                reason = "Image has intense glare or reflection obscuring details."
            elif avg_brightness < self.DARKNESS_THRESHOLD:
                is_acceptable = False
                reason = "Image is extremely underexposed (too dark) to reliably extract text."
                
            logger.info(f"IQA Check - Blur: {blur_variance:.2f}, Glare: {glare_percentage:.2f}%, Brightness: {avg_brightness:.2f}. Acceptable: {is_acceptable}")
            
            return {
                "is_acceptable": is_acceptable,
                "blur_score": float(blur_variance),
                "glare_score": float(glare_percentage),
                "brightness_score": float(avg_brightness),
                "reason": reason
            }
            
        except Exception as e:
            logger.error(f"Error in IQA check for {file_path}: {e}")
            return {
                "is_acceptable": False,
                "blur_score": 0.0,
                "glare_score": 0.0,
                "brightness_score": 0.0,
                "reason": f"System error during quality check: {str(e)}"
            }
            
    def check_cropping_heuristic(self, image_width: int, image_height: int, boxes: list) -> bool:
        """
        Heuristic to check if the document might be cropped.
        If any text bounding box is within CROP_MARGIN_PX of the absolute image edges,
        we assume the document physical margins were cropped out.
        Supports both formats:
        - 4-point: [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
        - Simple: [x, y, w, h]
        """
        for bbox in boxes:
            if isinstance(bbox[0], list):
                # 4-point format
                xs = [pt[0] for pt in bbox]
                ys = [pt[1] for pt in bbox]
                xmin = min(xs)
                xmax = max(xs)
                ymin = min(ys)
                ymax = max(ys)
            else:
                # Simple [x, y, w, h] format
                xmin = bbox[0]
                ymin = bbox[1]
                xmax = bbox[0] + bbox[2]
                ymax = bbox[1] + bbox[3]
            
            if (xmin <= self.CROP_MARGIN_PX or 
                ymin <= self.CROP_MARGIN_PX or 
                xmax >= (image_width - self.CROP_MARGIN_PX) or 
                ymax >= (image_height - self.CROP_MARGIN_PX)):
                return True # Likely cropped
                
        return False

iqa_service = ImageQualityService()
