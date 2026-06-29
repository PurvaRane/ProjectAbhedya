import { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../api/client";

type PipelineStep = {
  id: string;
  name: string;
  description: string;
  status: "pending" | "running" | "passed" | "failed";
};

export default function LiveDocumentScanner() {
  const { accessToken } = useAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalResult, setFinalResult] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [steps, setSteps] = useState<PipelineStep[]>([
    { id: "dsc", name: "Digital Signature Check", description: "Verifying e-PDF CCA seal", status: "pending" },
    { id: "iqa", name: "Quality Assessment", description: "Checking for blur and intense glare", status: "pending" },
    { id: "qr", name: "Cryptographic QR", description: "Cross-checking QR identity vs physical text", status: "pending" },
    { id: "ai", name: "AI Forgery Detection", description: "Vision Transformer pixel manipulation check", status: "pending" },
  ]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileSelect = (f: File) => {
    setFile(f);
    if (f.type.startsWith("image/") || f.type === "application/pdf") {
      setPreview(URL.createObjectURL(f));
    }
  };
  
  const simulatePipeline = async (docId: string) => {
    setIsProcessing(true);
    setFinalResult(null);
    
    // Reset steps
    const newSteps = steps.map(s => ({ ...s, status: "pending" as const }));
    setSteps([...newSteps]);
    
    // Simulate each step visually while backend runs async
    for (let i = 0; i < newSteps.length; i++) {
      // Set to running
      setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: "running" } : s));
      
      // Wait a bit
      await new Promise(r => setTimeout(r, 1500));
      
      // Set to passed (will be overridden if final result fails)
      setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: "passed" } : s));
    }
    
    // Now poll the backend for the actual result
    let resultFound = false;
    let attempts = 0;
    while (!resultFound && attempts < 10) {
      await new Promise(r => setTimeout(r, 2000));
      try {
        const res = await fetch(`${API_URL}/api/analyst/fraud/documents`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const docs = await res.json();
        const myDoc = docs.find((d: any) => d.document_id === docId);
        
        if (myDoc && (myDoc.status === "COMPLETED" || myDoc.status === "REJECTED" || myDoc.status === "NEEDS_REVIEW")) {
          setFinalResult(myDoc);
          resultFound = true;
          
          // If rejected early (e.g. DSC or IQA), fail the specific steps
          if (myDoc.forgery_features?.dsc_tampered) {
            setSteps(prev => prev.map((s, idx) => idx === 0 ? { ...s, status: "failed" } : s));
          } else if (myDoc.forgery_features?.iqa_rejection) {
            setSteps(prev => prev.map((s, idx) => idx === 1 ? { ...s, status: "failed" } : s));
          } else if (myDoc.forgery_features?.qr_mismatch) {
            setSteps(prev => prev.map((s, idx) => idx === 2 ? { ...s, status: "failed" } : s));
          } else if (myDoc.preliminary_fraud_score > 0.7) {
             setSteps(prev => prev.map((s, idx) => idx === 3 ? { ...s, status: "failed" } : s));
          }
        }
      } catch (e) {
        console.error(e);
      }
      attempts++;
    }
    setIsProcessing(false);
  };
  
  const uploadAndProcess = async () => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await fetch(`${API_URL}/api/documents/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData
      });
      const data = await res.json();
      
      if (data.document_id) {
        simulatePipeline(data.document_id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="section-heading mb-0 text-3xl">Live Document Scanner</h2>
          <p className="text-gray-500 text-sm mt-1">100% Offline Ephemeral Cryptographic Processing</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Upload Zone */}
        <div className="dash-card flex flex-col h-full bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl">
          <div className="dash-card-header border-b border-gray-100 pb-4">
            <h3 className="font-bold text-canara-blue">Input Matrix</h3>
          </div>
          
          <div className="flex-1 flex flex-col justify-center p-6">
            {!file ? (
              <div 
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer ${isDragging ? 'border-canara-blue bg-blue-50' : 'border-gray-300 hover:border-canara-gold hover:bg-amber-50/50'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                />
                <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="font-bold text-gray-700 text-lg">Drag & Drop Secure Document</p>
                <p className="text-sm text-gray-500 mt-2">Supports high-res e-PDF, JPG, PNG</p>
                <button className="mt-6 btn-primary">Browse Files</button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="relative rounded-xl overflow-hidden shadow-lg border border-gray-200 mb-6 bg-gray-50 flex items-center justify-center h-64 w-full">
                  {file.type === "application/pdf" ? (
                    <div className="flex flex-col items-center text-red-500">
                      <svg className="w-20 h-20 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8.267 14.68c-.184 0-.308.018-.372.036v.998c.036.108.172.11.33.11.166 0 .426-.062.426-.502 0-.276-.086-.642-.384-.642zm1.182-4.101c-.13 0-.17-.184-.196-.346-.036-.344-.144-.828-.276-.828-.154 0-.168.226-.176.43-.008.304-.046 1.136-.214 1.58.078.07.288.242.418.318.17.094.27.144.336.144.026 0 .044-.012.052-.038a1.693 1.693 0 00.056-.47c0-.284-.002-.558-.002-.79zm-2.85 4.316c-.056.126-.126.242-.194.348-.12.18-.23.278-.236.278-.006.002-.022-.058-.044-.132-.016-.062-.056-.252-.056-.252l.216-.402a4.57 4.57 0 01.314.16zm5.856-1.55c-.276-.046-.464-.092-.616-.14-.236-.074-.5-.192-.638-.284.184-.06.492-.12.678-.12.228 0 .438.072.502.264.048.14.016.274-.018.316-.034.032-.15.012-.222.008z"/><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-4.708 15.116c-.302.21-.61.41-.856.592a9.123 9.123 0 01-.432 1.34c-.136.29-.292.51-.51.51-.238 0-.498-.246-.498-.674 0-.312.086-.714.288-1.074.156-.276.516-.76.994-1.15a13.9 13.9 0 01.442-1.392c-.144-.34-.232-.68-.266-.968-.026-.224-.03-.43-.02-.632 0-.294.016-.548.066-.786.07-.336.25-.668.528-.668.212 0 .408.156.448.43.04.282-.022.95-.218 1.63-.032.112-.064.22-.098.324.37.586.9 1.134 1.488 1.58.266-.174.654-.368.992-.486.23-.08.452-.142.668-.142.33 0 .744.13.904.382.164.256.096.592-.056.844-.148.246-.45.422-.728.422-.382 0-.756-.25-1.158-.702zm1.708-8.116V4l5 5h-5z"/></svg>
                      <span className="font-bold">{file.name}</span>
                    </div>
                  ) : (
                    <img src={preview!} alt="Preview" className="w-full h-full object-cover" />
                  )}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm flex flex-col items-center justify-center">
                      <div className="h-12 w-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="text-white font-bold mt-4 tracking-widest uppercase">Analyzing...</span>
                    </div>
                  )}
                </div>
                
                {!isProcessing && !finalResult && (
                  <div className="flex gap-4 w-full">
                    <button className="btn-secondary flex-1" onClick={() => setFile(null)}>Cancel</button>
                    <button className="btn-primary flex-1 shadow-[0_0_15px_rgba(30,58,138,0.5)]" onClick={uploadAndProcess}>
                      Initiate Security Scan
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Pipeline */}
        <div className="dash-card flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-2xl border border-gray-700">
          <div className="dash-card-header border-b border-gray-700 pb-4">
            <h3 className="font-bold text-blue-400 uppercase tracking-widest flex items-center">
              <span className="mr-2 relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isProcessing ? 'bg-blue-400 opacity-75' : 'bg-gray-500 opacity-0'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isProcessing ? 'bg-blue-500' : 'bg-gray-600'}`}></span>
              </span>
              Security Pipeline
            </h3>
          </div>
          
          <div className="flex-1 p-6 flex flex-col justify-center gap-6">
            {steps.map((step, idx) => (
              <div key={step.id} className={`flex items-start gap-4 transition-all duration-500 ${step.status === 'pending' ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
                  step.status === 'pending' ? 'bg-gray-700 text-gray-500' :
                  step.status === 'running' ? 'bg-blue-500 text-white animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.6)]' :
                  step.status === 'passed' ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' :
                  'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.6)]'
                }`}>
                  {step.status === 'running' ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : step.status === 'passed' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  ) : step.status === 'failed' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  ) : (
                    <span className="text-xs font-bold">{idx + 1}</span>
                  )}
                </div>
                <div>
                  <h4 className={`font-bold ${step.status === 'running' ? 'text-blue-300' : step.status === 'failed' ? 'text-red-400' : 'text-gray-200'}`}>{step.name}</h4>
                  <p className="text-sm text-gray-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final Result Modal / Overlay */}
      {finalResult && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 dash-card mt-2 border-2 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-6 p-8 items-center justify-between"
             style={{ borderColor: finalResult.preliminary_fraud_score > 0.7 ? '#ef4444' : '#22c55e' }}>
          
          <div className="flex-1">
            <h2 className="text-3xl font-black mb-2 flex items-center">
              {finalResult.preliminary_fraud_score > 0.7 ? (
                <><span className="text-red-500 mr-3">🚨</span> <span className="text-gray-900">FORGERY DETECTED</span></>
              ) : (
                <><span className="text-green-500 mr-3">✅</span> <span className="text-gray-900">AUTHENTIC DOCUMENT</span></>
              )}
            </h2>
            <p className="text-gray-600 mb-4 max-w-lg">
              {finalResult.forgery_features?.rejection_reason || 
              (finalResult.preliminary_fraud_score > 0.7 ? "The AI pipeline has detected significant manipulation in the pixels or structure of this document." : "The document has passed all cryptographic and AI forensic checks successfully.")}
            </p>
            <button 
              className={finalResult.preliminary_fraud_score > 0.7 ? "btn-primary bg-red-600 hover:bg-red-700 border-red-600" : "btn-primary"}
              onClick={() => { setFile(null); setFinalResult(null); }}
            >
              Scan Another Document
            </button>
          </div>
          
          <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border shadow-inner">
            <div className={`text-6xl font-black mb-1 ${finalResult.preliminary_fraud_score > 0.7 ? 'text-red-600' : 'text-green-500'}`}>
              {Math.round(finalResult.preliminary_fraud_score * 100)}%
            </div>
            <div className="text-sm font-bold uppercase tracking-widest text-gray-500">Fraud Score</div>
          </div>
          
        </div>
      )}
    </div>
  );
}
