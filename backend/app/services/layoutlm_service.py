import os
import torch
from PIL import Image
from transformers import LayoutLMv3Processor, LayoutLMv3ForTokenClassification, LayoutLMv3ForSequenceClassification

# Map FUNSD labels
id2label = {
    0: "O",
    1: "B-HEADER",
    2: "I-HEADER",
    3: "B-QUESTION",
    4: "I-QUESTION",
    5: "B-ANSWER",
    6: "I-ANSWER"
}

class LayoutLMService:
    def __init__(self):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.model_path = os.path.join(base_dir, "models", "hf", "layoutlmv3")
        
        # Load locally if available, else fallback
        if not os.path.exists(self.model_path):
            print(f"Warning: LayoutLMv3 offline model not found at {self.model_path}. Using fallback.")
            self.model_path = "nielsr/layoutlmv3-finetuned-funsd"
            
        self.seq_model_path = os.path.join(base_dir, "models", "layoutlmv3_finetuned")
            
        self.processor = None
        self.model = None
        self.seq_model = None
        
        # Hardware acceleration for fast inference (MPS disabled due to macOS OpenCV threading bugs)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    def _initialize(self):
        if self.processor is None or self.model is None:
            self.processor = LayoutLMv3Processor.from_pretrained(self.model_path, apply_ocr=False, local_files_only=True)
            self.model = LayoutLMv3ForTokenClassification.from_pretrained(self.model_path, local_files_only=True).to(self.device)
            self.model.eval()
            
        if self.seq_model is None and os.path.exists(self.seq_model_path):
            try:
                self.seq_model = LayoutLMv3ForSequenceClassification.from_pretrained(self.seq_model_path, local_files_only=True).to(self.device)
                self.seq_model.eval()
            except Exception as e:
                print(f"Failed to load fine-tuned LayoutLMv3 seq model: {e}")

    def extract_layout_fields(self, image: Image.Image, words: list[str], boxes: list[list[int]]):
        """
        Extract layout entities using LayoutLMv3.
        Words and boxes should be provided from an OCR engine (e.g., PaddleOCR).
        Boxes are in format [xmin, ymin, xmax, ymax] normalized to 0-1000 range.
        """
        if not words or not boxes:
            return []
            
        self._initialize()
            
        encoding = self.processor(
            image, 
            words, 
            boxes=boxes, 
            return_tensors="pt",
            truncation=True,
            padding="max_length",
            max_length=512
        ).to(self.device)
        
        with torch.no_grad():
            outputs = self.model(**encoding)
            
        predictions = outputs.logits.argmax(-1).squeeze().tolist()
        token_boxes = encoding.bbox.squeeze().tolist()
        
        # Ensure predictions and token_boxes are lists even if single token
        if not isinstance(predictions, list):
            predictions = [predictions]
        if not isinstance(token_boxes[0], list):
            token_boxes = [token_boxes]

        entities = []
        current_entity = None
        
        for idx, (pred, box) in enumerate(zip(predictions, token_boxes)):
            # Skip padding tokens (usually [0, 0, 0, 0])
            if box == [0, 0, 0, 0]:
                continue
                
            label = id2label.get(pred, "O")
            if label == "O":
                if current_entity:
                    entities.append(current_entity)
                    current_entity = None
                continue
                
            prefix = label.split("-")[0]
            entity_type = label.split("-")[1]
            
            # Map back to original words roughly
            word_id = encoding.word_ids()[idx]
            if word_id is None:
                continue
                
            word = words[word_id]
            
            if prefix == "B" or not current_entity:
                if current_entity:
                    entities.append(current_entity)
                current_entity = {
                    "label": entity_type,
                    "text": word,
                    "box": box
                }
            elif prefix == "I" and current_entity and current_entity["label"] == entity_type:
                current_entity["text"] += " " + word
                # Expand box
                current_entity["box"] = [
                    min(current_entity["box"][0], box[0]),
                    min(current_entity["box"][1], box[1]),
                    max(current_entity["box"][2], box[2]),
                    max(current_entity["box"][3], box[3])
                ]
                
        if current_entity:
            entities.append(current_entity)
            
        return entities

    def predict_forgery(self, image: Image.Image, words: list[str], boxes: list[list[int]]) -> float:
        """
        Predicts forgery probability using the fine-tuned Sequence Classification model.
        Returns the probability of the FORGED class.
        Fast execution via MPS/CUDA.
        """
        if not words or not boxes:
            return 0.0
            
        self._initialize()
        
        if self.seq_model is None:
            return 0.0
            
        encoding = self.processor(
            image,
            words,
            boxes=boxes,
            return_tensors="pt",
            truncation=True,
            padding="max_length",
            max_length=512
        ).to(self.device)
        
        with torch.no_grad():
            outputs = self.seq_model(**encoding)
            
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
        # Class 1 is FORGED
        fraud_prob = probs[0][1].item()
        return float(fraud_prob)

layoutlm_service = LayoutLMService()
