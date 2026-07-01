import os
import uuid
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, BackgroundTasks
from sqlalchemy.orm import Session
from pathlib import Path

from app.db.session import get_db
from app.db.models import Document, DocumentUploadStatus, User
from app.api.auth.customer import get_current_customer
from app.schemas.document import DocumentUploadResponse, DocumentStatusResponse

router = APIRouter(
    prefix="/document",
    tags=["Customer Document"]
)

UPLOAD_DIR = Path("uploads/documents")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_customer: User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Upload a document for OCR, layout feature extraction, and visual embedding.
    """
    allowed_extensions = {".jpg", ".jpeg", ".png", ".pdf"}
    if document_type not in ["Aadhaar", "PAN", "GSTIN", "PDF", "Aadhaar / PAN Verification"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid document type."
        )

    ext = Path(file.filename).suffix.lower()

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Only JPG, PNG, and PDF are allowed."
        )
        
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="File too large. Maximum size is 10MB."
        )

    filename = f"{uuid.uuid4()}{ext}"
    file_path = UPLOAD_DIR / filename

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="File too large. Maximum size is 10MB."
        )

    with open(file_path, "wb") as buffer:
        buffer.write(content)

    # Create Database Record
    document = Document(
        user_id=current_customer.id,
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

@router.get("/status/{document_id}", response_model=DocumentStatusResponse)
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
