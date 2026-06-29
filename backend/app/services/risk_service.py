import logging
import json
import numpy as np
import shap
from sklearn.ensemble import RandomForestClassifier

logger = logging.getLogger(__name__)

class RiskService:
    def __init__(self):
        # We build a lightweight synthetic Random Forest to power SHAP explainability.
        # In a real production system, this would be a loaded .pkl model trained on real historical data.
        self.model = RandomForestClassifier(n_estimators=50, random_state=42)
        
        # Synthetic data to train the RF so it learns: 
        # Features: [ela, layout, metadata, cmfd, layoutlm_prob, vit_prob]
        X_train = np.array([
            [1.0, 10, 0.0, 0.0, 0.0, 0.0],   # Genuine
            [2.5, 12, 0.0, 0.0, 0.1, 0.05],  # Genuine
            [15.0, 10, 0.0, 0.0, 0.9, 0.8],  # Forged: High ELA, High AI
            [20.0, 11, 0.0, 0.2, 0.8, 0.9],  # Forged: High ELA, some cmfd
            [1.2, 0, 0.0, 0.0, 0.6, 0.7],    # Forged: Blank Layout
            [0.5, 20, 0.0, 0.0, 0.05, 0.1],  # Genuine
            [12.0, 2, 0.0, 0.0, 0.7, 0.9],   # Forged
            [0.5, 15, 1.0, 0.0, 0.8, 0.6],   # Forged: Metadata Adobe present
            [1.0, 10, 0.0, 0.8, 0.9, 0.8],   # Forged: High CMFD score
        ])
        y_train = np.array([0, 0, 1, 1, 1, 0, 1, 1, 1])
        
        self.feature_names = ["ela_score", "layout_entities_count", "metadata_anomaly", "cmfd_score", "layoutlm_forgery_prob", "vit_forgery_prob"]
        self.model.fit(X_train, y_train)
        
        # Initialize SHAP TreeExplainer
        self.explainer = shap.TreeExplainer(self.model)

    def calculate_risk(self, ela_score: float, layout_entities_count: int, metadata_anomaly: float = 0.0, cmfd_score: float = 0.0, tampered_fields: list = None, layoutlm_forgery_prob: float = 0.0, vit_forgery_prob: float = 0.0) -> dict:
        """
        Calculates the preliminary fraud score and generates SHAP explanations.
        """
        try:
            # Prepare feature vector
            X_input = np.array([[ela_score, layout_entities_count, metadata_anomaly, cmfd_score, layoutlm_forgery_prob, vit_forgery_prob]])
            
            # Predict fraud probability (Class 1)
            fraud_score = float(self.model.predict_proba(X_input)[0][1])
            
            # Generate SHAP values
            shap_values = self.explainer.shap_values(X_input)
            
            if isinstance(shap_values, list):
                fraud_shap = shap_values[1][0]
            else:
                if len(shap_values.shape) == 3:
                    fraud_shap = shap_values[0, :, 1]
                else:
                    fraud_shap = shap_values[0]
                    
            if isinstance(self.explainer.expected_value, list):
                base_value = float(self.explainer.expected_value[1])
            elif isinstance(self.explainer.expected_value, np.ndarray):
                base_value = float(self.explainer.expected_value[1])
            else:
                base_value = float(self.explainer.expected_value)
                
            explanations = {
                "base_risk": base_value,
                "contributions": {
                    "ela_score": float(fraud_shap[0]),
                    "layout_entities_count": float(fraud_shap[1]),
                    "metadata_anomaly": float(fraud_shap[2]),
                    "cmfd_score": float(fraud_shap[3]),
                    "layoutlm_forgery_prob": float(fraud_shap[4]),
                    "vit_forgery_prob": float(fraud_shap[5])
                }
            }
            
            # Inflate fraud score and add explicit explanation if tampering over fields is detected
            if tampered_fields:
                fraud_score = max(fraud_score, 0.95)  # 95% fraud probability
                explanations["explicit_tampering"] = f"CRITICAL: Computer Vision explicitly proved physical pixel tampering (Copy-Move) occurring directly over the following fields: {', '.join([f.upper() for f in tampered_fields])}."
            
            return {
                "preliminary_fraud_score": float(fraud_score),
                "shap_explanation": explanations
            }
            
        except Exception as e:
            logger.error(f"Failed to calculate risk score: {e}")
            return {
                "preliminary_fraud_score": 0.0,
                "shap_explanation": {}
            }

risk_service = RiskService()
