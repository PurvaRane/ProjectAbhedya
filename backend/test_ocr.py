"""Quick smoke-test for the PaddleOCR-based OCR service."""

from app.services.ocr_service import OCRService

print("Initializing OCR service...")
ocr = OCRService()

print("Running OCR on test Aadhaar image...")
result = ocr.extract("./test_docs/aadhar.jpg")

print(f"\nLines detected: {result['line_count']}")
print(f"\n--- Extracted Text ---\n{result['text']}")

print("\n--- Per-line details (first 5) ---")
for i, line in enumerate(result["lines"][:5]):
    print(f"  [{i+1}] ({line['confidence']:.2%}) {line['text']}")

print("\nDONE ✓")