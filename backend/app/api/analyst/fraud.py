from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from app.api.auth.employee import get_current_employee
from app.db.models import EmployeeAccount, EmployeeRole
from app.db.session import get_db
from app.services.gnn_service import GNNService
from app.schemas.document import DocumentAnalysisResponse

router = APIRouter(prefix="/api/analyst/fraud", tags=["Fraud Analyst"])

def require_fraud_analyst(current_employee: EmployeeAccount = Depends(get_current_employee)):
    if current_employee.role not in [EmployeeRole.ADMIN, EmployeeRole.FRAUD_ANALYST]:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_employee

@router.get("/rings/analyze")
def analyze_fraud_rings(
    current_employee: EmployeeAccount = Depends(require_fraud_analyst),
    db: Session = Depends(get_db)
):
    """
    Triggers the Heterogeneous Graph Neural Network (GNN) to analyze the database
    and return clustered fraud rings (users with high interconnected risk scores).
    """
    gnn_service = GNNService(db)
    results = gnn_service.analyze_fraud_rings()
    return results

@router.get("/documents", response_model=list[DocumentAnalysisResponse])
def get_analyzed_documents(
    current_employee: EmployeeAccount = Depends(require_fraud_analyst),
    db: Session = Depends(get_db)
):
    """
    Returns a list of uploaded documents and their AI analysis for the Analyst Dashboard.
    """
    from app.db.models import Document, DocumentAnalysis, User
    import json
    
    docs = db.query(Document, DocumentAnalysis, User).join(
        DocumentAnalysis, Document.id == DocumentAnalysis.document_id, isouter=True
    ).join(
        User, Document.user_id == User.id, isouter=True
    ).all()
    
    user_docs = {}
    for doc, analysis, user in docs:
        uid = user.id if user else None
        if uid:
            if uid not in user_docs:
                user_docs[uid] = []
            if analysis and analysis.forgery_features:
                try:
                    feat = json.loads(analysis.forgery_features)
                    user_docs[uid].append({"doc_id": str(doc.id), "ent": feat.get("extracted_entities", {})})
                except:
                    pass

    results = []
    for doc, analysis, user in docs:
        forgery_features = {}
        conflict_warnings = []
        if analysis and analysis.forgery_features:
            try:
                forgery_features = json.loads(analysis.forgery_features)
                my_ent = forgery_features.get("extracted_entities", {})
                
                uid = user.id if user else None
                if uid and uid in user_docs:
                    for other in user_docs[uid]:
                        if other["doc_id"] != str(doc.id):
                            o_ent = other["ent"]
                            # Check Identity Mismatches
                            for key in ['pan', 'aadhaar', 'gstin']:
                                if key in my_ent and key in o_ent:
                                    val_my = my_ent[key].get("value", "") if isinstance(my_ent[key], dict) else my_ent[key]
                                    val_o = o_ent[key].get("value", "") if isinstance(o_ent[key], dict) else o_ent[key]
                                    if val_my and val_o and val_my != val_o:
                                        conflict_warnings.append(f"Identity Mismatch: {key.upper()} on this document conflicts with another document uploaded by this user.")
                            
                            # Check Financials
                            if 'financials' in my_ent and 'financials' in o_ent:
                                for f_m in my_ent['financials']:
                                    for f_o in o_ent['financials']:
                                        if f_m['type'] == f_o['type']:
                                            diff = abs(f_m['amount'] - f_o['amount'])
                                            max_a = max(f_m['amount'], f_o['amount'])
                                            if max_a > 0 and (diff / max_a) > 0.1:
                                                conflict_warnings.append(f"Financial Fraud: The {f_m['type']} amounts declared logically contradict other documents uploaded by this user.")
                                                
            except:
                pass
                
        # deduplicate warnings
        conflict_warnings = list(set(conflict_warnings))
        forgery_features["cross_document_conflicts"] = conflict_warnings

        results.append({
            "document_id": str(doc.id),
            "user_name": user.full_name if user else "Unknown",
            "document_type": doc.document_type,
            "status": doc.status.value,
            "file_path": doc.file_path,
            "created_at": doc.created_at.isoformat() if doc.created_at else None,
            "preliminary_fraud_score": analysis.preliminary_fraud_score if analysis else 0.0,
            "forgery_features": forgery_features
        })
        
    return results

@router.post("/verify/{document_id}")
def verify_document(
    document_id: str,
    current_employee: EmployeeAccount = Depends(require_fraud_analyst),
    db: Session = Depends(get_db)
):
    """
    Manually triggers the AI security pipeline (document_pipeline) for a pending document.
    """
    from fastapi import HTTPException
    from app.db.models import Document
    from app.services.document_pipeline import document_pipeline

    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.status.name != "PENDING":
        return {"message": "Document is already verified or in processing.", "status": doc.status.value}

    # Immediately lock the document to prevent double-clicks queueing multiple tasks
    from app.db.models import DocumentUploadStatus
    doc.status = DocumentUploadStatus.PROCESSING
    db.commit()

    # Start the massive AI pipeline in the background using Celery
    from app.services.document_pipeline import process_document_task
    process_document_task.delay(str(doc.id))

    return {"message": "AI Pipeline Verification started.", "status": "PROCESSING"}
