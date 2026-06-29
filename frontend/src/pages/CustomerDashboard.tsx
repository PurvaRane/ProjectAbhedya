import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/DashboardLayout";
import { apiClient } from "../api/client";

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function CustomerDashboard() {
  const { role, accessToken, logout } = useAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("Aadhaar");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  
  type UploadedDoc = { id: string; type: string; statusResult: any; isChecking: boolean };
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !accessToken) return;

    setIsUploading(true);
    setUploadMessage("");

    try {
      const payload = parseJwt(accessToken);
      const userId = payload?.sub;

      if (!userId) {
        setUploadMessage("Error: Could not identify user ID from token.");
        setIsUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", docType);
      formData.append("user_id", userId);

      const res = await apiClient.post("/customer/document/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setUploadMessage(res.data.message);
      setUploadedDocs(prev => [{ id: res.data.document_id, type: docType, statusResult: null, isChecking: false }, ...prev]);
      setFile(null); // Reset file input
    } catch (err: any) {
      setUploadMessage(
        err.response?.data?.detail || "Upload failed. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const checkStatus = async (docId: string) => {
    setUploadedDocs(prev => prev.map(doc => doc.id === docId ? { ...doc, isChecking: true } : doc));
    try {
      const res = await apiClient.get(`/customer/document/status/${docId}`);
      setUploadedDocs(prev => prev.map(doc => doc.id === docId ? { ...doc, statusResult: res.data } : doc));
    } catch (err: any) {
      alert("Status check failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setUploadedDocs(prev => prev.map(doc => doc.id === docId ? { ...doc, isChecking: false } : doc));
    }
  };

  return (
    <DashboardLayout
      title="Customer Dashboard"
      subtitle={`Role: ${role}`}
      onLogout={logout}
    >
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-card">
        <div className="border-b-4 border-canara-gold pb-4 mb-6">
          <h1 className="text-2xl font-bold text-canara-blue">
            Welcome to VeriTrust
          </h1>
          <p className="mt-1 text-gray-600">
            Secure Document Verification Portal
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* UPLOAD SECTION */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
            <h2 className="text-lg font-semibold text-canara-blue mb-4">
              1. Upload Document for Verification
            </h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-canara-gold focus:ring-canara-gold sm:text-sm p-2 border"
                >
                  <option value="Aadhaar">Aadhaar Card</option>
                  <option value="PAN">PAN Card</option>
                  <option value="Other">Other Document</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Image / PDF
                </label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-canara-blue file:text-white hover:file:bg-canara-blue-light"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isUploading || !file}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-canara-gold hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-canara-gold disabled:opacity-50"
              >
                {isUploading ? "Uploading..." : "Upload Document"}
              </button>

              {uploadMessage && (
                <p className="text-sm font-medium text-green-600 mt-2">
                  {uploadMessage}
                </p>
              )}
            </form>
          </div>

          {/* STATUS SECTION */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm flex flex-col max-h-[600px] overflow-y-auto">
            <h2 className="text-lg font-semibold text-canara-blue mb-4 sticky top-0 bg-white z-10 pb-2 border-b">
              2. Document Status Queue ({uploadedDocs.length})
            </h2>
            
            {uploadedDocs.length === 0 ? (
              <p className="text-sm text-gray-500 italic mt-4">
                Upload one or multiple documents to see their statuses here.
              </p>
            ) : (
              <div className="space-y-6 mt-4">
                {uploadedDocs.map((doc, idx) => (
                  <div key={doc.id} className="p-4 rounded-md border border-gray-200 bg-gray-50 relative">
                    <div className="absolute top-2 right-2 bg-canara-gold text-white text-xs px-2 py-1 rounded font-bold">
                      {doc.type}
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      ID: <span className="font-normal font-mono text-xs">{doc.id}</span>
                    </p>
                    
                    <button
                      onClick={() => checkStatus(doc.id)}
                      disabled={doc.isChecking}
                      className="w-full flex justify-center py-2 px-4 border border-canara-blue rounded-md shadow-sm text-sm font-medium text-canara-blue bg-white hover:bg-gray-50 focus:outline-none disabled:opacity-50"
                    >
                      {doc.isChecking ? "Checking..." : "Refresh Status"}
                    </button>

                    {doc.statusResult && (
                      <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                        <h3 className="font-semibold text-gray-800 mb-2">Verification Status</h3>
                        
                        {doc.statusResult.status === "PENDING" && (
                          <div className="p-3 rounded-md bg-yellow-100 text-yellow-800 font-bold border border-yellow-200">
                            ⏳ Pending Employee Verification
                          </div>
                        )}
                        
                        {doc.statusResult.status === "PROCESSING" && (
                          <div className="p-3 rounded-md bg-blue-100 text-blue-800 font-bold border border-blue-200 animate-pulse">
                            ⚙️ In Review by Bank Employee
                          </div>
                        )}

                        {doc.statusResult.status === "COMPLETED" && (
                          <div className="p-3 rounded-md bg-green-100 text-green-800 font-bold border border-green-200">
                            ✅ Document Verified
                          </div>
                        )}
                        
                        {doc.statusResult.status === "REJECTED" && (
                          <div className="p-3 rounded-md bg-red-100 text-red-800 font-bold border border-red-200">
                            ❌ Document Rejected
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-1 text-sm font-medium text-canara-blue hover:underline"
        >
          ← Back to Home
        </Link>
      </div>
    </DashboardLayout>
  );
}
