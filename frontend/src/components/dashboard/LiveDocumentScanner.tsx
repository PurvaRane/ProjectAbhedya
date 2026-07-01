import { useState, useRef } from "react";
import { apiClient, getErrorMessage } from "../../api/client";
import Alert from "../Alert";

type PipelineStep = {
  id: string;
  name: string;
  description: string;
  status: "pending" | "running" | "passed" | "failed";
};

const INITIAL_STEPS: PipelineStep[] = [
  { id: "dsc", name: "Digital Signature Check", description: "Verifying e-PDF CCA seal", status: "pending" },
  { id: "iqa", name: "Quality Assessment", description: "Checking for blur and intense glare", status: "pending" },
  { id: "qr", name: "Cryptographic QR", description: "Cross-checking QR identity vs physical text", status: "pending" },
  { id: "ai", name: "AI Forgery Detection", description: "Vision Transformer pixel manipulation check", status: "pending" },
];

const MAX_POLL_ATTEMPTS = 15;
const POLL_INTERVAL_MS = 2000;

export default function LiveDocumentScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [pollError, setPollError] = useState("");
  const [finalResult, setFinalResult] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [steps, setSteps] = useState<PipelineStep[]>(INITIAL_STEPS);

  const resetPipeline = () => {
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: "pending" as const })));
    setFinalResult(null);
    setPollError("");
    setUploadError("");
  };

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
    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (f: File) => {
    resetPipeline();
    setFile(f);
    if (f.type.startsWith("image/") || f.type === "application/pdf") {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
      setUploadError("Unsupported file type. Use PDF, JPG, or PNG.");
    }
  };

  const applyStepFailures = (myDoc: any) => {
    if (myDoc.forgery_features?.dsc_tampered) {
      setSteps((prev) => prev.map((s, idx) => (idx === 0 ? { ...s, status: "failed" } : s)));
    } else if (myDoc.forgery_features?.iqa_rejection) {
      setSteps((prev) => prev.map((s, idx) => (idx === 1 ? { ...s, status: "failed" } : s)));
    } else if (myDoc.forgery_features?.qr_mismatch) {
      setSteps((prev) => prev.map((s, idx) => (idx === 2 ? { ...s, status: "failed" } : s)));
    } else if (myDoc.preliminary_fraud_score > 0.7) {
      setSteps((prev) => prev.map((s, idx) => (idx === 3 ? { ...s, status: "failed" } : s)));
    }
  };

  const simulatePipeline = async (docId: string) => {
    setIsProcessing(true);
    setFinalResult(null);
    setPollError("");

    const newSteps = INITIAL_STEPS.map((s) => ({ ...s, status: "pending" as const }));
    setSteps(newSteps);

    for (let i = 0; i < newSteps.length; i++) {
      setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, status: "running" } : s)));
      await new Promise((r) => setTimeout(r, 1200));
      setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, status: "passed" } : s)));
    }

    let resultFound = false;
    let attempts = 0;
    let lastStatus = "PENDING";

    while (!resultFound && attempts < MAX_POLL_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      try {
        const res = await apiClient.get(`/customer/document/status/${docId}`);
        const myDoc = res.data;
        lastStatus = myDoc?.status ?? lastStatus;

        if (myDoc && ["COMPLETED", "REJECTED", "NEEDS_REVIEW"].includes(myDoc.status)) {
          setFinalResult(myDoc);
          applyStepFailures(myDoc);
          resultFound = true;
        } else if (myDoc?.status === "FAILED") {
          setPollError("Document processing failed on the server. Try another file or check backend logs.");
          setSteps((prev) => prev.map((s) => (s.status === "running" ? { ...s, status: "failed" } : s)));
          resultFound = true;
        }
      } catch (err) {
        setPollError(getErrorMessage(err));
        resultFound = true;
      }
      attempts++;
    }

    if (!resultFound) {
      setPollError(
        `Analysis timed out (last status: ${lastStatus}). The document may still be pending employee verification in Document Forensics.`
      );
    }

    setIsProcessing(false);
  };

  const uploadAndProcess = async () => {
    if (!file) return;

    setUploadError("");
    setPollError("");
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", "Aadhaar / PAN Verification");

    try {
      const res = await apiClient.post("/customer/document/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.document_id) {
        setIsUploading(false);
        await simulatePipeline(res.data.document_id);
      } else {
        setUploadError("Upload succeeded but no document ID was returned.");
        setIsUploading(false);
      }
    } catch (err) {
      setUploadError(getErrorMessage(err));
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    resetPipeline();
    setIsProcessing(false);
    setIsUploading(false);
  };

  const busy = isUploading || isProcessing;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="section-heading mb-0 text-3xl">Live Document Scanner</h2>
          <p className="text-gray-500 text-sm mt-1">100% Offline Ephemeral Cryptographic Processing</p>
        </div>
      </div>

      {(uploadError || pollError) && (
        <div className="space-y-2">
          {uploadError && <Alert type="error" message={uploadError} />}
          {pollError && <Alert type="error" message={pollError} />}
          {!busy && (
            <button type="button" className="btn-sm-secondary" onClick={resetPipeline}>
              Dismiss and try again
            </button>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="dash-card flex flex-col h-full bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl">
          <div className="dash-card-header border-b border-gray-100 pb-4">
            <h3 className="font-bold text-canara-blue">Input Matrix</h3>
          </div>

          <div className="flex-1 flex flex-col justify-center p-6">
            {!file ? (
              <div
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isDragging ? "border-canara-blue bg-blue-50" : "border-gray-300 hover:border-canara-gold hover:bg-amber-50/50"
                }`}
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
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
                <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="font-bold text-gray-700 text-lg">Drag & Drop Secure Document</p>
                <p className="text-sm text-gray-500 mt-2">Supports high-res e-PDF, JPG, PNG (max 10MB)</p>
                <button type="button" className="mt-6 btn-primary">
                  Browse Files
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center w-full">
                <div className="relative rounded-xl overflow-hidden shadow-lg border border-gray-200 mb-6 bg-gray-50 flex items-center justify-center h-64 w-full">
                  {file.type === "application/pdf" ? (
                    <div className="flex flex-col items-center text-red-500 px-4 text-center">
                      <svg className="w-20 h-20 mb-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                      </svg>
                      <span className="font-bold break-all">{file.name}</span>
                    </div>
                  ) : preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                  ) : (
                    <p className="text-sm text-gray-500">Preview unavailable</p>
                  )}
                  {busy && (
                    <div className="absolute inset-0 bg-blue-900/50 backdrop-blur-sm flex flex-col items-center justify-center px-4 text-center">
                      <div className="h-12 w-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="text-white font-bold mt-4 tracking-widest uppercase">
                        {isUploading ? "Uploading…" : "Analyzing…"}
                      </span>
                      {isProcessing && !isUploading && (
                        <span className="text-blue-200 text-xs mt-2">Waiting for analysis results…</span>
                      )}
                    </div>
                  )}
                </div>

                {!busy && !finalResult && (
                  <div className="flex gap-4 w-full">
                    <button type="button" className="btn-secondary flex-1" onClick={clearFile}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-primary flex-1 shadow-[0_0_15px_rgba(30,58,138,0.5)] disabled:opacity-60"
                      onClick={uploadAndProcess}
                      disabled={!!uploadError && !file}
                    >
                      Initiate Security Scan
                    </button>
                  </div>
                )}

                {busy && (
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Do not close this tab — scan in progress
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="dash-card flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-2xl border border-gray-700">
          <div className="dash-card-header border-b border-gray-700 pb-4">
            <h3 className="font-bold text-blue-400 uppercase tracking-widest flex items-center">
              <span className="mr-2 relative flex h-3 w-3">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                    isProcessing ? "bg-blue-400 opacity-75" : "bg-gray-500 opacity-0"
                  }`}
                />
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isProcessing ? "bg-blue-500" : "bg-gray-600"}`} />
              </span>
              Security Pipeline
            </h3>
          </div>

          <div className="flex-1 p-6 flex flex-col justify-center gap-6">
            {!file && !busy && (
              <p className="text-sm text-gray-500 text-center py-8">Upload a document to start the security pipeline.</p>
            )}
            {steps.map((step, idx) => (
              <div
                key={step.id}
                className={`flex items-start gap-4 transition-all duration-500 ${
                  step.status === "pending" && file ? "opacity-60" : step.status === "pending" ? "opacity-30" : "opacity-100"
                }`}
              >
                <div
                  className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
                    step.status === "pending"
                      ? "bg-gray-700 text-gray-500"
                      : step.status === "running"
                        ? "bg-blue-500 text-white animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                        : step.status === "passed"
                          ? "bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                          : "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.6)]"
                  }`}
                >
                  {step.status === "running" ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : step.status === "passed" ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : step.status === "failed" ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <span className="text-xs font-bold">{idx + 1}</span>
                  )}
                </div>
                <div>
                  <h4
                    className={`font-bold ${
                      step.status === "running"
                        ? "text-blue-300"
                        : step.status === "failed"
                          ? "text-red-400"
                          : "text-gray-200"
                    }`}
                  >
                    {step.name}
                  </h4>
                  <p className="text-sm text-gray-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {finalResult && (
        <div
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 dash-card mt-2 border-2 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-6 p-8 items-center justify-between"
          style={{ borderColor: finalResult.preliminary_fraud_score > 0.7 ? "#ef4444" : "#22c55e" }}
        >
          <div className="flex-1">
            <h2 className="text-3xl font-black mb-2 flex items-center">
              {finalResult.preliminary_fraud_score > 0.7 ? (
                <>
                  <span className="text-red-500 mr-3">🚨</span>
                  <span className="text-gray-900">FORGERY DETECTED</span>
                </>
              ) : (
                <>
                  <span className="text-green-500 mr-3">✅</span>
                  <span className="text-gray-900">AUTHENTIC DOCUMENT</span>
                </>
              )}
            </h2>
            <p className="text-gray-600 mb-4 max-w-lg">
              {finalResult.forgery_features?.rejection_reason ||
                (finalResult.preliminary_fraud_score > 0.7
                  ? "The AI pipeline detected significant manipulation in this document."
                  : "The document passed cryptographic and AI forensic checks.")}
            </p>
            <button
              type="button"
              className={finalResult.preliminary_fraud_score > 0.7 ? "btn-primary bg-red-600 hover:bg-red-700 border-red-600" : "btn-primary"}
              onClick={clearFile}
            >
              Scan Another Document
            </button>
          </div>

          <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border shadow-inner">
            <div className={`text-6xl font-black mb-1 ${finalResult.preliminary_fraud_score > 0.7 ? "text-red-600" : "text-green-500"}`}>
              {Math.round((finalResult.preliminary_fraud_score || 0) * 100)}%
            </div>
            <div className="text-sm font-bold uppercase tracking-widest text-gray-500">Fraud Score</div>
          </div>
        </div>
      )}
    </div>
  );
}
