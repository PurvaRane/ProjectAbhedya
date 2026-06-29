import os
import uuid
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, BackgroundTasks
from sqlalchemy.orm import Session
from pathlib import Path

from app.db.session import get_db
from app.db.models import Document, DocumentUploadStatus
from app.services.document_pipeline import document_pipeline

router = APIRouter(
    prefix="/document",
    tags=["Customer Document"]
)

UPLOAD_DIR = Path("uploads/documents")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    user_id: uuid.UUID = Form(...),
    document_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a document for OCR, layout feature extraction, and visual embedding.
    """
    allowed_extensions = {".jpg", ".jpeg", ".png", ".pdf"}
    ext = Path(file.filename).suffix.lower()

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Only JPG, PNG, and PDF are allowed."
        )

    filename = f"{uuid.uuid4()}{ext}"
    file_path = UPLOAD_DIR / filename

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    # Create Database Record
    document = Document(
        user_id=user_id,
        document_type=document_type,
        file_path=str(file_path),
        status=DocumentUploadStatus.PENDING
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    # Document is saved as PENDING. The AI pipeline will only run when an Employee manually verifies it.
    
    return {
        "message": "Document uploaded successfully. Awaiting employee verification.",
        "document_id": str(document.id),
        "status": document.status.value
    }

@router.get("/status/{document_id}")
def get_document_status(
    document_id: str,
    db: Session = Depends(get_db)
):
    from app.db.models import DocumentAnalysis
    import json
    
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    response = {
        "document_id": str(doc.id),
        "status": doc.status.value,
        "document_type": doc.document_type
    }
    
    if doc.status.value in ["COMPLETED", "NEEDS_REVIEW", "REJECTED"]:
        analysis = db.query(DocumentAnalysis).filter(DocumentAnalysis.document_id == document_id).first()
        if analysis:
            response["preliminary_fraud_score"] = analysis.preliminary_fraud_score
            response["is_forged"] = analysis.preliminary_fraud_score > 0.7
            if analysis.forgery_features:
                try:
                    response["forgery_features"] = json.loads(analysis.forgery_features)
                except:
                    response["forgery_features"] = {}
                    
    return response
