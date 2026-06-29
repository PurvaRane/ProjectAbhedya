import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../api/client";

type DocumentAnalysisResult = {
  document_id: string;
  user_name: string;
  document_type: string;
  status: string;
  file_path: string;
  created_at: string;
  preliminary_fraud_score: number;
  forgery_features: {
    ela_score?: number;
    max_difference?: number;
    heatmap_path?: string;
    metadata_anomaly?: number;
    software_signature?: string;
    cmfd_score?: number;
    cmfd_matches?: number;
    shap_explanation?: {
      base_risk: number;
      contributions: {
        ela_score: number;
        layout_entities_count: number;
        metadata_anomaly: number;
        cmfd_score: number;
      };
    };
    cross_document_conflicts?: string[];
  };
};

export default function DocumentForensics() {
  const { accessToken } = useAuth();
  const [documents, setDocuments] = useState<DocumentAnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<DocumentAnalysisResult | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/analyst/fraud/documents`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch documents");
      const data = await res.json();
      setDocuments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getShapTranslation = (shap: any, features: any): { text: string; type: "danger" | "success" | "warning" }[] => {
    const statements: { text: string; type: "danger" | "success" | "warning" }[] = [];

    if (features?.iqa_rejection) {
      statements.push({ text: `🚨 UPLOAD REJECTED: ${features.rejection_reason || "The image failed the physical quality assessment (too blurry or intense glare)." } Please request a clearer photo from the customer before running the expensive AI.`, type: "danger" });
      return statements;
    }

    if (shap && shap.explicit_tampering) {
      statements.push({ text: shap.explicit_tampering, type: "danger" });
    }

    if (!shap || !shap.contributions) {
      if (statements.length === 0) statements.push({ text: "The AI did not find any strong signals to explain the score.", type: "warning" });
      return statements;
    }

    const c = shap.contributions;

    // ELA
    if (c.ela_score > 0.05) {
      statements.push({ text: "Error Level Analysis detected mismatched JPEG compression, strongly indicating that physical pixels were spliced or copy-pasted.", type: "danger" });
    } else if (c.ela_score < -0.05) {
      statements.push({ text: "The physical pixels appear highly consistent with no obvious compression artifacts.", type: "success" });
    }

    // Metadata
    if (c.metadata_anomaly > 0.1 || features.metadata_anomaly === 1) {
      statements.push({ text: `The hidden EXIF metadata proves this document was manipulated using unauthorized software (${features.software_signature || "image editor"}).`, type: "danger" });
    }

    // CMFD
    if (c.cmfd_score > 0.05 || features.cmfd_score > 0) {
      statements.push({ text: `Copy-Move Forgery Detection found ${features.cmfd_matches} cloned pixel patches, indicating text or numbers were cloned to inflate values.`, type: "danger" });
    }

    // Layout
    if (c.layout_entities_count > 0.05) {
      statements.push({ text: "The document's spatial layout is anomalous (missing standard bounding box components expected in genuine templates).", type: "warning" });
    } else if (c.layout_entities_count < -0.05) {
      statements.push({ text: "The structural layout perfectly matches the expected geometric density of a genuine document.", type: "success" });
    }

    // Cross-Document GNN Conflicts
    if (features.cross_document_conflicts && features.cross_document_conflicts.length > 0) {
      features.cross_document_conflicts.forEach((conflict: string) => {
        statements.push({ text: `🚨 GNN CROSS-VALIDATION: ${conflict}`, type: "danger" });
      });
    }

    if (statements.length === 0) {
      statements.push({ text: "The AI did not find any strong signals to explain the score.", type: "warning" });
    }

    return statements;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-heading mb-0">Document Forensics & Explainable AI</h2>
        <button onClick={fetchDocuments} className="btn-sm-secondary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200 text-red-700">
          Error: {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-canara-blue border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Document List */}
          <div className="dash-card lg:col-span-1 max-h-[800px] overflow-y-auto">
            <div className="dash-card-header sticky top-0 bg-white z-10 pb-2">
              <h3 className="font-bold text-canara-blue">Analyzed Documents</h3>
              <span className="badge-verified">{documents.length} Total</span>
            </div>
            <div className="flex flex-col gap-3 mt-2">
              {documents.map(doc => {
                const fraudScore = Math.round((doc.preliminary_fraud_score || 0) * 100);
                const isHighRisk = fraudScore > 70;
                return (
                  <div 
                    key={doc.document_id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`p-3 rounded-lg border cursor-pointer transition ${selectedDoc?.document_id === doc.document_id ? 'border-canara-blue bg-blue-50/50' : 'border-gray-200 hover:border-canara-gold bg-white'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-bold text-gray-800">{doc.user_name}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${isHighRisk ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {fraudScore}% Risk
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">{doc.document_type}</div>
                    <div className="text-[10px] text-gray-400 font-mono truncate">{doc.document_id}</div>
                  </div>
                )
              })}
              {documents.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-8">No documents analyzed yet.</div>
              )}
            </div>
          </div>

          {/* Details Panel */}
          {selectedDoc ? (
            <div className="dash-card lg:col-span-2 flex flex-col gap-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-xl font-bold text-canara-blue mb-1">Document: {selectedDoc.document_type}</h3>
                  <p className="text-sm text-gray-500 mb-2">Uploaded by <span className="font-semibold text-gray-700">{selectedDoc.user_name}</span> on {new Date(selectedDoc.created_at).toLocaleString()}</p>
                  <span className={`px-3 py-1 inline-block rounded-full text-xs font-bold border ${
                    selectedDoc.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 
                    selectedDoc.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse' : 
                    selectedDoc.status === 'NEEDS_REVIEW' || selectedDoc.preliminary_fraud_score > 0.7 ? 'bg-red-100 text-red-800 border-red-300' : 
                    selectedDoc.status === 'REJECTED' ? 'bg-gray-800 text-white border-gray-900' : 'bg-green-100 text-green-800 border-green-300'
                  }`}>
                    {selectedDoc.status === 'PENDING' ? 'STATUS: PENDING VERIFICATION' :
                     selectedDoc.status === 'PROCESSING' ? 'STATUS: AI PIPELINE RUNNING...' : 
                     selectedDoc.status === 'NEEDS_REVIEW' || selectedDoc.preliminary_fraud_score > 0.7 ? 'STATUS: HIGH RISK (FORGED)' : 
                     selectedDoc.status === 'REJECTED' ? 'STATUS: REJECTED (POOR QUALITY)' : 'STATUS: AUTHENTIC'}
                  </span>
                </div>
                {selectedDoc.status !== 'PENDING' && selectedDoc.status !== 'PROCESSING' && (
                  <div className={`flex flex-col items-center justify-center w-24 h-24 rounded-full border-4 ${selectedDoc.preliminary_fraud_score > 0.7 ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
                    <span className={`text-2xl font-black ${selectedDoc.preliminary_fraud_score > 0.7 ? 'text-red-600' : 'text-green-600'}`}>
                      {Math.round(selectedDoc.preliminary_fraud_score * 100)}%
                    </span>
                    <span className={`text-[10px] font-bold uppercase ${selectedDoc.preliminary_fraud_score > 0.7 ? 'text-red-500' : 'text-green-500'}`}>Risk Score</span>
                  </div>
                )}
              </div>

              {selectedDoc.status === 'PENDING' ? (
                <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <div className="text-5xl mb-4">🕵️‍♂️</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Awaiting AI Forensics</h3>
                  <p className="text-gray-500 text-center max-w-md mb-6">
                    This document has been uploaded by the customer but has not yet been processed by the VeriTrust AI pipeline. Click below to initiate forensic analysis.
                  </p>
                  <button 
                    onClick={async () => {
                      try {
                        const res = await fetch(`${API_URL}/api/analyst/fraud/verify/${selectedDoc.document_id}`, {
                          method: 'POST',
                          headers: { Authorization: `Bearer ${accessToken}` }
                        });
                        if (!res.ok) throw new Error("Failed to trigger verification");
                        // Refresh to show PROCESSING
                        fetchDocuments();
                      } catch (err: any) {
                        alert("Error: " + err.message);
                      }
                    }}
                    className="btn-primary py-3 px-8 text-lg font-bold flex items-center shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    <svg className="w-5 h-5 mr-2 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    Verify Document (Run AI)
                  </button>
                </div>
              ) : selectedDoc.status === 'PROCESSING' ? (
                <div className="flex flex-col items-center justify-center py-16 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-canara-blue border-t-transparent mb-6"></div>
                  <h3 className="text-xl font-bold text-canara-blue mb-2">AI Pipeline is Running</h3>
                  <p className="text-blue-700 text-center">Extracting features, scanning for pixel manipulation, and checking fraud rings...</p>
                  <p className="text-xs text-blue-500 mt-2">(Please wait ~5 seconds and click the Refresh button above)</p>
                </div>
              ) : (
                <>
                  {/* Explainable AI (Plain English) */}
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-canara-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Explainable AI Insights (SHAP)
                    </h4>
                    <div className="flex flex-col gap-2">
                      {getShapTranslation(selectedDoc.forgery_features?.shap_explanation, selectedDoc.forgery_features).map((stmt, idx) => (
                        <div key={idx} className={`p-4 rounded-lg border shadow-sm text-sm font-medium flex items-start gap-3 ${
                          stmt.type === 'danger' ? 'bg-red-50 border-red-200 text-red-800' : 
                          stmt.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 
                          'bg-amber-50 border-amber-200 text-amber-800'
                        }`}>
                          <span className="mt-0.5 text-lg">
                            {stmt.type === 'danger' ? '🚨' : stmt.type === 'success' ? '✅' : '⚠️'}
                          </span>
                          <span className="leading-relaxed">{stmt.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Heatmap Visualization */}
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center mt-4">
                      <svg className="w-5 h-5 mr-2 text-canara-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Visual Evidence
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm flex flex-col">
                        <div className="bg-gray-100 text-sm font-bold text-gray-700 px-4 py-2 border-b">Original Document</div>
                        <div className="p-4 flex-1 flex items-center justify-center bg-gray-50 min-h-[300px]">
                            <img src={`${API_URL}/${selectedDoc.file_path}`} alt="Original" className="max-h-[300px] object-contain shadow-sm rounded" onError={(e) => { e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='400' height='300' fill='%23f3f4f6'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%239ca3af'>Image Not Available</text></svg>"; }} />
                        </div>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm flex flex-col">
                        <div className="bg-gray-100 text-sm font-bold text-gray-700 px-4 py-2 border-b flex justify-between">
                          <span>Physical Tampering Heatmap</span>
                          {selectedDoc.forgery_features?.heatmap_path && (
                             <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded border border-red-200">Red = Forged Pixels</span>
                          )}
                        </div>
                        <div className="p-4 flex-1 flex items-center justify-center bg-gray-50 min-h-[300px]">
                          {selectedDoc.forgery_features?.heatmap_path ? (
                            <img src={`${API_URL}/${selectedDoc.forgery_features.heatmap_path}`} alt="Heatmap" className="max-h-[300px] object-contain shadow-sm rounded" onError={(e) => { e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='400' height='300' fill='%23f3f4f6'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%239ca3af'>Heatmap Not Generated</text></svg>"; }} />
                          ) : (
                            <div className="text-sm text-gray-400">No Tampering Heatmap Generated</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="dash-card lg:col-span-2 flex items-center justify-center text-gray-400 min-h-[400px]">
              Select a document from the list to view its forensic analysis.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
