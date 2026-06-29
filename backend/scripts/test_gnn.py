import os
import sys
import json
import uuid
import torch
import torch.nn.functional as F

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.db.models import User, Document, DocumentAnalysis, DocumentUploadStatus, UserRole
from app.services.gnn_service import GNNService

def main():
    db = SessionLocal()
    
    try:
        # Create a shared device ID
        shared_device = "suspicious-device-xyz"
        
        # Create identical ViT embeddings
        # A dummy 768-d vector
        dummy_vec = [0.1] * 768
        
        print("1. Injecting dummy fraud ring data into database...")
        user1 = User(
            full_name="Alice Fraudster",
            email="alice@fraud.com",
            password_hash="dummy",
            role=UserRole.CUSTOMER,
            last_device_id=shared_device,
        )
        user2 = User(
            full_name="Bob Fraudster",
            email="bob@fraud.com",
            password_hash="dummy",
            role=UserRole.CUSTOMER,
            last_device_id=shared_device,
        )
        
        db.add(user1)
        db.add(user2)
        db.commit()
        
        doc1 = Document(
            user_id=user1.id,
            document_type="balance_sheet",
            file_path="/dummy/path1",
            status=DocumentUploadStatus.COMPLETED
        )
        doc2 = Document(
            user_id=user2.id,
            document_type="balance_sheet",
            file_path="/dummy/path2",
            status=DocumentUploadStatus.COMPLETED
        )
        db.add(doc1)
        db.add(doc2)
        db.commit()
        
        # Flag doc1 as heavily suspicious initially (LayoutLM found anomaly)
        da1 = DocumentAnalysis(
            document_id=doc1.id,
            vit_embedding=json.dumps(dummy_vec),
            preliminary_fraud_score=1.0  # highly suspicious
        )
        # Doc 2 is identical in template but not initially flagged
        da2 = DocumentAnalysis(
            document_id=doc2.id,
            vit_embedding=json.dumps(dummy_vec),
            preliminary_fraud_score=0.0  # seemingly clean
        )
        db.add(da1)
        db.add(da2)
        db.commit()
        
        print("2. Running Heterogeneous GNN Fraud Ring Analysis...")
        gnn = GNNService(db)
        results = gnn.analyze_fraud_rings()
        
        print("\n--- GNN Output ---")
        for ring in results["fraud_rings"]:
            # Only print our test users
            if ring["name"] in ["Alice Fraudster", "Bob Fraudster"]:
                print(f"User: {ring['name']} | Risk Score: {ring['risk_score']:.4f}")
                
        print("\nNotice how Bob's risk score is high even though his document wasn't initially flagged! The GNN propagated the risk across the shared device and identical ViT template.")
        
    finally:
        # Cleanup
        db.rollback()
        db.query(DocumentAnalysis).filter(DocumentAnalysis.document_id.in_([doc1.id, doc2.id])).delete(synchronize_session=False)
        db.query(Document).filter(Document.id.in_([doc1.id, doc2.id])).delete(synchronize_session=False)
        db.query(User).filter(User.id.in_([user1.id, user2.id])).delete(synchronize_session=False)
        db.commit()
        db.close()

if __name__ == "__main__":
    main()
