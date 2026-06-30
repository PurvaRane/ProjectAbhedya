import json
import logging
from typing import Dict, List, Any

import torch
import torch.nn.functional as F
from sqlalchemy.orm import Session
from torch_geometric.data import HeteroData
from torch_geometric.nn import HeteroConv, SAGEConv

from app.db.models import User, Document, DocumentAnalysis

logger = logging.getLogger(__name__)

class HeteroFraudGCN(torch.nn.Module):
    def __init__(self, hidden_channels: int, out_channels: int):
        super().__init__()
        
        # We use SAGEConv for all edge types to propagate signals
        self.conv1 = HeteroConv({
            ('user', 'logs_in_from', 'device'): SAGEConv((-1, -1), hidden_channels),
            ('user', 'logs_in_from', 'ip'): SAGEConv((-1, -1), hidden_channels),
            ('user', 'uses', 'mobile'): SAGEConv((-1, -1), hidden_channels),
            ('user', 'uses', 'email_domain'): SAGEConv((-1, -1), hidden_channels),
            ('user', 'has', 'pan'): SAGEConv((-1, -1), hidden_channels),
            ('user', 'has', 'aadhaar'): SAGEConv((-1, -1), hidden_channels),
            ('user', 'uploads', 'document'): SAGEConv((-1, -1), hidden_channels),
            ('document', 'similar_to', 'document'): SAGEConv((-1, -1), hidden_channels),
            ('document', 'conflicts_with', 'document'): SAGEConv((-1, -1), hidden_channels),
            ('document', 'has_entity', 'text_entity'): SAGEConv((-1, -1), hidden_channels),
            ('user', 'similar_face', 'user'): SAGEConv((-1, -1), hidden_channels),
            
            # Reverse edges for bidirectional message passing
            ('device', 'rev_logs_in_from', 'user'): SAGEConv((-1, -1), hidden_channels),
            ('ip', 'rev_logs_in_from', 'user'): SAGEConv((-1, -1), hidden_channels),
            ('mobile', 'rev_uses', 'user'): SAGEConv((-1, -1), hidden_channels),
            ('email_domain', 'rev_uses', 'user'): SAGEConv((-1, -1), hidden_channels),
            ('pan', 'rev_has', 'user'): SAGEConv((-1, -1), hidden_channels),
            ('aadhaar', 'rev_has', 'user'): SAGEConv((-1, -1), hidden_channels),
            ('document', 'rev_uploads', 'user'): SAGEConv((-1, -1), hidden_channels),
            ('document', 'rev_conflicts_with', 'document'): SAGEConv((-1, -1), hidden_channels),
            ('text_entity', 'rev_has_entity', 'document'): SAGEConv((-1, -1), hidden_channels),
        }, aggr='sum')

        self.conv2 = HeteroConv({
            ('user', 'logs_in_from', 'device'): SAGEConv((-1, -1), out_channels),
            ('user', 'logs_in_from', 'ip'): SAGEConv((-1, -1), out_channels),
            ('user', 'uses', 'mobile'): SAGEConv((-1, -1), out_channels),
            ('user', 'uses', 'email_domain'): SAGEConv((-1, -1), out_channels),
            ('user', 'has', 'pan'): SAGEConv((-1, -1), out_channels),
            ('user', 'has', 'aadhaar'): SAGEConv((-1, -1), out_channels),
            ('user', 'uploads', 'document'): SAGEConv((-1, -1), out_channels),
            ('document', 'similar_to', 'document'): SAGEConv((-1, -1), out_channels),
            ('document', 'conflicts_with', 'document'): SAGEConv((-1, -1), out_channels),
            ('document', 'has_entity', 'text_entity'): SAGEConv((-1, -1), out_channels),
            ('user', 'similar_face', 'user'): SAGEConv((-1, -1), out_channels),
            
            ('device', 'rev_logs_in_from', 'user'): SAGEConv((-1, -1), out_channels),
            ('ip', 'rev_logs_in_from', 'user'): SAGEConv((-1, -1), out_channels),
            ('mobile', 'rev_uses', 'user'): SAGEConv((-1, -1), out_channels),
            ('email_domain', 'rev_uses', 'user'): SAGEConv((-1, -1), out_channels),
            ('pan', 'rev_has', 'user'): SAGEConv((-1, -1), out_channels),
            ('aadhaar', 'rev_has', 'user'): SAGEConv((-1, -1), out_channels),
            ('document', 'rev_uploads', 'user'): SAGEConv((-1, -1), out_channels),
            ('document', 'rev_conflicts_with', 'document'): SAGEConv((-1, -1), out_channels),
            ('text_entity', 'rev_has_entity', 'document'): SAGEConv((-1, -1), out_channels),
        }, aggr='sum')

    def forward(self, x_dict, edge_index_dict):
        x_dict = self.conv1(x_dict, edge_index_dict)
        x_dict = {key: F.relu(x) for key, x in x_dict.items()}
        x_dict = self.conv2(x_dict, edge_index_dict)
        return x_dict

class GNNService:
    def __init__(self, db: Session):
        self.db = db
        
    def _get_domain(self, email: str) -> str:
        if not email or "@" not in email:
            return ""
        return email.split("@")[1].lower()

    def build_fraud_graph(self) -> tuple[HeteroData, Dict]:
        logger.info("Constructing Heterogeneous Fraud Graph...")
        data = HeteroData()
        
        # 1. Fetch DB Records
        users = self.db.query(User).all()
        doc_analyses = self.db.query(DocumentAnalysis).all()
        
        # We need the User->Document mapping
        docs = self.db.query(Document).all()
        doc_to_user = {d.id: d.user_id for d in docs}
        
        # ID Mappings
        user_idx = {u.id: i for i, u in enumerate(users)}
        doc_idx = {d.id: i for i, d in enumerate(doc_analyses)}
        
        # Auxiliary Nodes (using sets to get unique, then mapping to idx)
        devices = list(set([u.last_device_id for u in users if u.last_device_id]))
        ips = list(set([u.last_ip_address for u in users if u.last_ip_address]))
        mobiles = list(set([u.mobile_number for u in users if u.mobile_number]))
        pans = list(set([u.pan_number for u in users if u.pan_number]))
        aadhaars = list(set([u.aadhaar_number for u in users if u.aadhaar_number]))
        emails = list(set([self._get_domain(u.email) for u in users if u.email]))
        
        device_idx = {d: i for i, d in enumerate(devices)}
        ip_idx = {ip: i for i, ip in enumerate(ips)}
        mobile_idx = {m: i for i, m in enumerate(mobiles)}
        pan_idx = {p: i for i, p in enumerate(pans)}
        aadhaar_idx = {a: i for i, a in enumerate(aadhaars)}
        email_idx = {e: i for i, e in enumerate(emails)}
        
        # Build set of all unique text entities found in documents (e.g., DOBs, Names, IDs)
        all_text_entities = set()
        doc_entities_map = {}
        for d in doc_analyses:
            doc_entities_map[d.id] = []
            if d.forgery_features:
                try:
                    feat = json.loads(d.forgery_features)
                    ents = feat.get("extracted_entities", {})
                    for field_type, field_data in ents.items():
                        if "value" in field_data:
                            val = f"{field_type}:{field_data['value']}"
                            all_text_entities.add(val)
                            doc_entities_map[d.id].append(val)
                except:
                    pass
        text_entities_list = list(all_text_entities)
        text_entity_idx = {e: i for i, e in enumerate(text_entities_list)}
        
        # Initial Node Features (1-dimensional dummy for auxiliary nodes, 1-dim for users, 768-dim for docs)
        data['user'].x = torch.ones(len(users), 1)
        
        if len(doc_analyses) > 0:
            doc_features = []
            for d in doc_analyses:
                if d.vit_embedding:
                    try:
                        vec = json.loads(d.vit_embedding)
                        # ensure it's a list of floats
                        doc_features.append(vec)
                    except:
                        doc_features.append([0.0]*768)
                else:
                    doc_features.append([0.0]*768)
            data['document'].x = torch.tensor(doc_features, dtype=torch.float)
        else:
            data['document'].x = torch.empty((0, 768), dtype=torch.float)
            
        # Dummy features for identity/network nodes
        data['device'].x = torch.ones(len(devices), 1) if devices else torch.empty((0, 1))
        data['ip'].x = torch.ones(len(ips), 1) if ips else torch.empty((0, 1))
        data['mobile'].x = torch.ones(len(mobiles), 1) if mobiles else torch.empty((0, 1))
        data['pan'].x = torch.ones(len(pans), 1) if pans else torch.empty((0, 1))
        data['aadhaar'].x = torch.ones(len(aadhaars), 1) if aadhaars else torch.empty((0, 1))
        data['email_domain'].x = torch.ones(len(emails), 1) if emails else torch.empty((0, 1))
        data['text_entity'].x = torch.ones(len(text_entities_list), 1) if text_entities_list else torch.empty((0, 1))
        
        # Helper to create empty tensors if no edges exist
        def empty_edge_index():
            return torch.empty((2, 0), dtype=torch.long)
            
        # 2. Build Edges
        u_d_src, u_d_dst = [], []
        u_ip_src, u_ip_dst = [], []
        u_m_src, u_m_dst = [], []
        u_e_src, u_e_dst = [], []
        u_p_src, u_p_dst = [], []
        u_a_src, u_a_dst = [], []
        
        for u in users:
            uid = user_idx[u.id]
            if u.last_device_id:
                u_d_src.append(uid)
                u_d_dst.append(device_idx[u.last_device_id])
            if u.last_ip_address:
                u_ip_src.append(uid)
                u_ip_dst.append(ip_idx[u.last_ip_address])
            if u.mobile_number:
                u_m_src.append(uid)
                u_m_dst.append(mobile_idx[u.mobile_number])
            if u.pan_number:
                u_p_src.append(uid)
                u_p_dst.append(pan_idx[u.pan_number])
            if u.aadhaar_number:
                u_a_src.append(uid)
                u_a_dst.append(aadhaar_idx[u.aadhaar_number])
            domain = self._get_domain(u.email)
            if domain:
                u_e_src.append(uid)
                u_e_dst.append(email_idx[domain])
                
        data['user', 'logs_in_from', 'device'].edge_index = torch.tensor([u_d_src, u_d_dst], dtype=torch.long) if u_d_src else empty_edge_index()
        data['user', 'logs_in_from', 'ip'].edge_index = torch.tensor([u_ip_src, u_ip_dst], dtype=torch.long) if u_ip_src else empty_edge_index()
        data['user', 'uses', 'mobile'].edge_index = torch.tensor([u_m_src, u_m_dst], dtype=torch.long) if u_m_src else empty_edge_index()
        data['user', 'uses', 'email_domain'].edge_index = torch.tensor([u_e_src, u_e_dst], dtype=torch.long) if u_e_src else empty_edge_index()
        data['user', 'has', 'pan'].edge_index = torch.tensor([u_p_src, u_p_dst], dtype=torch.long) if u_p_src else empty_edge_index()
        data['user', 'has', 'aadhaar'].edge_index = torch.tensor([u_a_src, u_a_dst], dtype=torch.long) if u_a_src else empty_edge_index()
        
        # Reverse edges
        data['device', 'rev_logs_in_from', 'user'].edge_index = torch.tensor([u_d_dst, u_d_src], dtype=torch.long) if u_d_src else empty_edge_index()
        data['ip', 'rev_logs_in_from', 'user'].edge_index = torch.tensor([u_ip_dst, u_ip_src], dtype=torch.long) if u_ip_src else empty_edge_index()
        data['mobile', 'rev_uses', 'user'].edge_index = torch.tensor([u_m_dst, u_m_src], dtype=torch.long) if u_m_src else empty_edge_index()
        data['email_domain', 'rev_uses', 'user'].edge_index = torch.tensor([u_e_dst, u_e_src], dtype=torch.long) if u_e_src else empty_edge_index()
        data['pan', 'rev_has', 'user'].edge_index = torch.tensor([u_p_dst, u_p_src], dtype=torch.long) if u_p_src else empty_edge_index()
        data['aadhaar', 'rev_has', 'user'].edge_index = torch.tensor([u_a_dst, u_a_src], dtype=torch.long) if u_a_src else empty_edge_index()
        
        # User -> Document
        u_doc_src, u_doc_dst = [], []
        for d in doc_analyses:
            uid = doc_to_user.get(d.document_id)
            if uid and uid in user_idx:
                u_doc_src.append(user_idx[uid])
                u_doc_dst.append(doc_idx[d.id])
                
        data['user', 'uploads', 'document'].edge_index = torch.tensor([u_doc_src, u_doc_dst], dtype=torch.long) if u_doc_src else empty_edge_index()
        data['document', 'rev_uploads', 'user'].edge_index = torch.tensor([u_doc_dst, u_doc_src], dtype=torch.long) if u_doc_dst else empty_edge_index()
        
        # Document -> TextEntity
        d_te_src, d_te_dst = [], []
        for d in doc_analyses:
            d_id = doc_idx[d.id]
            for ent_val in doc_entities_map.get(d.id, []):
                d_te_src.append(d_id)
                d_te_dst.append(text_entity_idx[ent_val])
                
        data['document', 'has_entity', 'text_entity'].edge_index = torch.tensor([d_te_src, d_te_dst], dtype=torch.long) if d_te_src else empty_edge_index()
        data['text_entity', 'rev_has_entity', 'document'].edge_index = torch.tensor([d_te_dst, d_te_src], dtype=torch.long) if d_te_src else empty_edge_index()
        
        # Document <-> Document (ViT Similarity > 0.95)
        d_sim_src, d_sim_dst = [], []
        if len(doc_analyses) > 1:
            doc_tensor = data['document'].x
            norm_doc = F.normalize(doc_tensor, p=2, dim=1)
            sim_matrix = torch.mm(norm_doc, norm_doc.t())
            indices = torch.where(sim_matrix > 0.95)
            for i, j in zip(indices[0].tolist(), indices[1].tolist()):
                if i != j:
                    d_sim_src.append(i)
                    d_sim_dst.append(j)
                    
        data['document', 'similar_to', 'document'].edge_index = torch.tensor([d_sim_src, d_sim_dst], dtype=torch.long) if d_sim_src else empty_edge_index()
        
        # Document <-> Document (Entity Conflicts for same User)
        conflict_src, conflict_dst = [], []
        
        # Group doc_analyses by user
        user_to_docs = {}
        for d in doc_analyses:
            uid = doc_to_user.get(d.document_id)
            if uid:
                if uid not in user_to_docs:
                    user_to_docs[uid] = []
                user_to_docs[uid].append(d)
                
        for uid, docs_list in user_to_docs.items():
            if len(docs_list) < 2:
                continue
                
            # Pairwise compare
            for i in range(len(docs_list)):
                for j in range(i + 1, len(docs_list)):
                    doc_a = docs_list[i]
                    doc_b = docs_list[j]
                    
                    try:
                        feat_a = json.loads(doc_a.forgery_features) if doc_a.forgery_features else {}
                        feat_b = json.loads(doc_b.forgery_features) if doc_b.forgery_features else {}
                        ent_a = feat_a.get("extracted_entities", {})
                        ent_b = feat_b.get("extracted_entities", {})
                    except:
                        continue
                        
                    conflict = False
                    # Check exact matches for identity
                    for key in ['pan', 'aadhaar', 'gstin', 'pincode']:
                        if key in ent_a and key in ent_b:
                            if ent_a[key] != ent_b[key]:
                                conflict = True
                                break
                    
                    # Check financial inconsistencies
                    if not conflict and 'financials' in ent_a and 'financials' in ent_b:
                        # Very simple heuristic: if they have the same financial keyword but values differ by > 10%
                        for f_a in ent_a['financials']:
                            for f_b in ent_b['financials']:
                                if f_a['type'] == f_b['type']:
                                    diff = abs(f_a['amount'] - f_b['amount'])
                                    max_amt = max(f_a['amount'], f_b['amount'])
                                    if max_amt > 0 and (diff / max_amt) > 0.1:
                                        conflict = True
                                        break
                            if conflict:
                                break
                                
                    if conflict:
                        conflict_src.append(doc_idx[doc_a.id])
                        conflict_dst.append(doc_idx[doc_b.id])
                        # Symmetric
                        conflict_src.append(doc_idx[doc_b.id])
                        conflict_dst.append(doc_idx[doc_a.id])
                        
        data['document', 'conflicts_with', 'document'].edge_index = torch.tensor([conflict_src, conflict_dst], dtype=torch.long) if conflict_src else empty_edge_index()
        data['document', 'rev_conflicts_with', 'document'].edge_index = torch.tensor([conflict_dst, conflict_src], dtype=torch.long) if conflict_src else empty_edge_index()

        
        # User <-> User (Face Similarity > 0.95)
        u_sim_src, u_sim_dst = [], []
        face_users = []
        for u in users:
            if u.face_embedding:
                try:
                    f_vec = json.loads(u.face_embedding)
                    face_users.append((user_idx[u.id], f_vec))
                except:
                    pass
                    
        if len(face_users) > 1:
            face_tensor = torch.tensor([f[1] for f in face_users], dtype=torch.float)
            norm_face = F.normalize(face_tensor, p=2, dim=1)
            sim_matrix = torch.mm(norm_face, norm_face.t())
            indices = torch.where(sim_matrix > 0.95)
            for i, j in zip(indices[0].tolist(), indices[1].tolist()):
                if i != j:
                    u_sim_src.append(face_users[i][0])
                    u_sim_dst.append(face_users[j][0])
                    
        data['user', 'similar_face', 'user'].edge_index = torch.tensor([u_sim_src, u_sim_dst], dtype=torch.long) if u_sim_src else empty_edge_index()
        
        return data, user_idx

    def analyze_fraud_rings(self) -> Dict[str, Any]:
        """
        Runs the GNN over the database graph and computes a risk score for each user.
        """
        graph, user_idx = self.build_fraud_graph()
        
        # Edge cases: no users or no edges
        if graph['user'].num_nodes == 0:
            return {"fraud_rings": []}
            
        docs = self.db.query(DocumentAnalysis).all()
        doc_scores = []
        for d in docs:
            score = d.preliminary_fraud_score if d.preliminary_fraud_score else 0.0
            doc_scores.append([score])
            
        if len(doc_scores) > 0:
            graph['document'].x = torch.tensor(doc_scores, dtype=torch.float)
            
        # Ensure all edge indexes are at least empty tensors of right shape
        for edge_type in graph.edge_types:
            if 'edge_index' not in graph[edge_type]:
                graph[edge_type].edge_index = torch.empty((2, 0), dtype=torch.long)
                
        model = HeteroFraudGCN(hidden_channels=16, out_channels=1)
        model.eval()
        
        with torch.no_grad():
            out_dict = model(graph.x_dict, graph.edge_index_dict)
            
        user_scores = out_dict['user'].view(-1).tolist()
        
        idx_user = {v: k for k, v in user_idx.items()}
        
        results = []
        for i, score in enumerate(user_scores):
            user_id = idx_user[i]
            user = self.db.query(User).filter(User.id == user_id).first()
            if user:
                results.append({
                    "user_id": str(user.id),
                    "name": user.full_name,
                    "email": user.email,
                    "risk_score": float(score),
                    "is_active": user.is_active
                })
                
        results.sort(key=lambda x: x["risk_score"], reverse=True)
        return {
            "fraud_rings": results,
            "experimental_warning": "demo/experimental: GNN uses untrained weights for demonstration"
        }
