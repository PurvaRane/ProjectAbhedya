import os
import sys
from PIL import Image

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.forgery_service import forgery_service
from app.services.risk_service import risk_service

def main():
    # 1. Create a dummy image
    dummy_img_path = "/tmp/dummy_test_image.jpg"
    img = Image.new('RGB', (800, 600), color='white')
    img.save(dummy_img_path)
    
    print("--- Testing Forgery Service (ELA) ---")
    forgery_data = forgery_service.perform_ela(dummy_img_path)
    ela_score = forgery_data["ela_score"]
    print(f"ELA Score: {ela_score}")
    print(f"Max Difference: {forgery_data['max_difference']}")
    
    print("\n--- Testing Risk Service (SHAP) ---")
    # Simulate a document with the computed ELA and 15 layout entities
    risk_data = risk_service.calculate_risk(ela_score, layout_entities_count=15)
    
    print(f"Preliminary Fraud Score: {risk_data['preliminary_fraud_score']:.4f}")
    print("SHAP Explanation:")
    print(risk_data["shap_explanation"])

if __name__ == "__main__":
    main()
