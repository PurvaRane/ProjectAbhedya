import time
from paddleocr import PaddleOCR

print("Initializing Devanagari model...")
start = time.time()
ocr = PaddleOCR(use_angle_cls=True, lang="devanagari", show_log=True, use_gpu=False)
print(f"Loaded in {time.time() - start:.2f}s")

print("Running inference on a test image (if any) or just initialized successfully.")
