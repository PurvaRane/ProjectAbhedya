from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Document, DocumentUploadStatus, User
from app.services.document_pipeline import document_pipeline

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)

UPLOAD_DIR = Path("uploads/documents")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):

    allowed_extensions = {
        ".jpg",
        ".jpeg",
        ".png",
        ".pdf"
    }

    ext = Path(file.filename).suffix.lower()

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type"
        )

    filename = f"{uuid4()}{ext}"
    file_path = UPLOAD_DIR / filename

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    # For testing, grab the first user or create one
    user = db.query(User).first()
    if not user:
        user = User(full_name="System Tester", email="tester@veritrust.in", password_hash="mock")
        db.add(user)
        db.commit()
        db.refresh(user)

    doc = Document(
        user_id=user.id,
        document_type="Aadhaar / PAN Verification",
        file_path=str(file_path),
        status=DocumentUploadStatus.PENDING
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    # Trigger the AI Security Pipeline in the background
    background_tasks.add_task(document_pipeline.process_document, str(doc.id))

    return {
        "message": "Document uploaded and pipeline initiated",
        "document_id": str(doc.id),
        "filename": filename,
        "path": str(file_path)
    }