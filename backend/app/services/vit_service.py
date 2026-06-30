import os
import torch
from PIL import Image
from transformers import ViTImageProcessor, ViTModel, ViTForImageClassification

import threading

class ViTService:
    def __init__(self):
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.model_path = os.path.join(base_dir, "models", "hf", "vit-base")
        
        if not os.path.exists(self.model_path):
            print(f"Warning: ViT offline model not found at {self.model_path}. Using fallback.")
            self.model_path = "google/vit-base-patch16-224-in21k"
            
        self.classification_model_path = os.path.join(base_dir, "models", "vit_finetuned")
            
        self.processor = None
        self.model = None
        self.classification_model = None
        
        # Hardware acceleration for fast inference (MPS disabled due to macOS OpenCV threading bugs)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._lock = threading.Lock()

    def _initialize(self):
        # Always use the local fine-tuned model path to avoid HuggingFace network calls
        with self._lock:
            if self.processor is None or self.model is None:
                self.processor = ViTImageProcessor.from_pretrained(self.classification_model_path, local_files_only=True)
                
            if self.classification_model is None and os.path.exists(self.classification_model_path):
                try:
                    self.classification_model = ViTForImageClassification.from_pretrained(self.classification_model_path, local_files_only=True).to(self.device)
                    self.classification_model.eval()
                    # Get the base model from the classification model
                    self.model = self.classification_model.vit
                    self.model.eval()
                except Exception as e:
                    print(f"Failed to load fine-tuned ViT: {e}")

    def extract_visual_embedding(self, image: Image.Image) -> list[float]:
        """
        Extract a 768-dimensional visual embedding vector from the image.
        """
        # Convert image to RGB if not already
        if image.mode != "RGB":
            image = image.convert("RGB")
            
        self._initialize()
            
        inputs = self.processor(images=image, return_tensors="pt").to(self.device)
        
        with torch.no_grad():
            outputs = self.model(**inputs)
            
        # Get the pooled output (embedding for the entire image from the [CLS] token)
        # pooled_output shape is (batch_size, hidden_size), where hidden_size is typically 768
        embedding = outputs.last_hidden_state[:, 0, :].squeeze().tolist()
        
        return embedding

    def predict_forgery(self, image: Image.Image) -> float:
        """
        Uses the fine-tuned ViT model to predict the probability of forgery.
        Fast execution via MPS/CUDA.
        """
        if image.mode != "RGB":
            image = image.convert("RGB")
            
        self._initialize()
        
        if self.classification_model is None:
            return 0.0
            
        inputs = self.processor(images=image, return_tensors="pt").to(self.device)
        
        with torch.no_grad():
            outputs = self.classification_model(**inputs)
            
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
        # Class 1 is FORGED
        fraud_prob = probs[0][1].item()
        
        # Normalize the raw probability (which heavily biases around 0.61 for baseline images)
        # to a zero-centered severity score in range [-1.0, 1.0] for the frontend.
        score = (fraud_prob - 0.65) * 10.0
        
        return float(max(min(score, 1.0), -1.0))

vit_service = ViTService()
