from pydantic import BaseModel
from typing import Dict, Any, Optional

class DocumentUploadResponse(BaseModel):
    message: str
    document_id: str
    status: str

class DocumentStatusResponse(BaseModel):
    document_id: str
    status: str
    document_type: str
    preliminary_fraud_score: Optional[float] = None
    is_forged: Optional[bool] = None
    forgery_features: Optional[Dict[str, Any]] = None

class DocumentAnalysisResponse(BaseModel):
    document_id: str
    user_name: str
    document_type: str
    status: str
    file_path: str
    created_at: Optional[str] = None
    preliminary_fraud_score: float
    forgery_features: Dict[str, Any]
