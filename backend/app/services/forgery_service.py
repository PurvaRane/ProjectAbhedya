import cv2
import numpy as np
from PIL import Image, ImageChops, ImageEnhance
import io
import logging

logger = logging.getLogger(__name__)

class ForgeryService:
    def __init__(self):
        pass

    def perform_ela(self, image_path: str, quality: int = 90) -> dict:
        """
        Performs Error Level Analysis (ELA) to detect JPEG compression anomalies.
        Returns the ELA score and the path to the generated ELA heatmap image.
        """
        try:
            if image_path.lower().endswith(".png"):
                return {
                    "ela_score": 0.0,
                    "max_difference": 0,
                    "heatmap_path": "",
                    "note": "ELA skipped for PNG file"
                }
            original = Image.open(image_path).convert('RGB')
            
            # Save the image at a specific quality level in memory
            temp_io = io.BytesIO()
            original.save(temp_io, 'JPEG', quality=quality)
            temp_io.seek(0)
            
            resaved = Image.open(temp_io)
            
            # Calculate the absolute difference between original and resaved
            diff = ImageChops.difference(original, resaved)
            diff_array = np.array(diff)
            
            # Instead of perceptual grayscale weighting (which OpenCV's applyColorMap does to 3-channel images),
            # which can obscure anomalies isolated in a single color channel (e.g. Red channel),
            # we take the maximum difference across the RGB channels for each pixel.
            diff_max = np.max(diff_array, axis=2)
            
            max_diff = float(np.max(diff_max))
            if max_diff == 0:
                max_diff = 1.0
                
            # Scale the 2D difference array to the full 0-255 range so anomalies are clearly visible
            scale = 255.0 / max_diff
            ela_scaled = np.clip(diff_max * scale, 0, 255).astype(np.uint8)
            
            # Calculate ELA score (normalized variance of the max difference)
            # High variance often indicates splicing/tampering
            ela_score = float(np.var(diff_max) / 255.0)
            
            # Save the ELA heatmap
            import os
            from pathlib import Path
            p = Path(image_path)
            heatmap_path = os.path.join(p.parent, f"ela_{p.stem}.jpg")
            
            # Apply JET colormap directly to the 2D grayscale array (0 -> Blue, 255 -> Red)
            heatmap = cv2.applyColorMap(ela_scaled, cv2.COLORMAP_JET)
            cv2.imwrite(heatmap_path, heatmap)
            
            return {
                "ela_score": ela_score,
                "max_difference": max_diff,
                "heatmap_path": heatmap_path
            }
        except Exception as e:
            logger.error(f"Failed to perform ELA on {image_path}: {e}")
            return {
                "ela_score": 0.0,
                "max_difference": 0,
                "heatmap_path": ""
            }

    def extract_metadata(self, image_path: str) -> dict:
        """
        Extracts EXIF metadata to check for software manipulation signatures.
        """
        try:
            img = Image.open(image_path)
            exif_data = img._getexif()
            
            anomaly_score = 0.0
            suspicious_software = ["adobe", "photoshop", "gimp", "canva", "illustrator", "coreldraw"]
            software_found = ""

            if exif_data:
                # 305 is the EXIF tag for 'Software'
                software = str(exif_data.get(305, "")).lower()
                for suspicious in suspicious_software:
                    if suspicious in software:
                        anomaly_score = 1.0
                        software_found = software
                        break
                        
            return {
                "metadata_anomaly_score": anomaly_score,
                "software_signature": software_found
            }
        except Exception as e:
            logger.error(f"Failed to extract metadata from {image_path}: {e}")
            return {
                "metadata_anomaly_score": 0.0,
                "software_signature": ""
            }

    def detect_copy_move(self, image_path: str, extracted_entities: dict = None) -> dict:
        """
        Detects Copy-Move Forgery using ORB feature matching.
        Cross-references matches with extracted text bounding boxes to identify specific tampered fields.
        """
        try:
            img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
            if img is None:
                raise ValueError("Could not read image for CMFD")

            # Initialize ORB detector
            orb = cv2.ORB_create(nfeatures=1000)
            keypoints, descriptors = orb.detectAndCompute(img, None)

            if descriptors is None or len(descriptors) < 10:
                return {"cmfd_score": 0.0, "suspicious_matches": 0, "tampered_fields": []}

            # Use Brute-Force Matcher with Hamming distance
            bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
            matches = bf.knnMatch(descriptors, descriptors, k=2)

            suspicious_matches = 0
            tampered_fields = set()
            
            # Helper to check if a point (x,y) is inside a bounding box
            def is_inside(pt, bbox):
                # bbox is [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
                xs = [p[0] for p in bbox]
                ys = [p[1] for p in bbox]
                return min(xs) <= pt[0] <= max(xs) and min(ys) <= pt[1] <= max(ys)

            for m, n in matches:
                if m.distance > 0 and m.distance < 0.75 * n.distance:
                    pt1 = keypoints[m.queryIdx].pt
                    pt2 = keypoints[m.trainIdx].pt
                    
                    phys_dist = np.sqrt((pt1[0] - pt2[0])**2 + (pt1[1] - pt2[1])**2)
                    
                    if phys_dist > 50:
                        suspicious_matches += 1
                        
                        # Check intersection with extracted text fields
                        if extracted_entities:
                            for field_type, field_data in extracted_entities.items():
                                if "bbox" in field_data:
                                    if is_inside(pt1, field_data["bbox"]) or is_inside(pt2, field_data["bbox"]):
                                        tampered_fields.add(field_type)

            cmfd_score = min(1.0, suspicious_matches / 20.0) 
            
            return {
                "cmfd_score": float(cmfd_score),
                "suspicious_matches": suspicious_matches,
                "tampered_fields": list(tampered_fields)
            }
            
        except Exception as e:
            logger.error(f"Failed to perform CMFD on {image_path}: {e}")
            return {
                "cmfd_score": 0.0,
                "suspicious_matches": 0
            }

forgery_service = ForgeryService()
