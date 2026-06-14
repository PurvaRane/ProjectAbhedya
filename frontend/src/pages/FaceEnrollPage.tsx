import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import AuthLayout from "../components/AuthLayout";
import Alert from "../components/Alert";

import { authApi, getErrorMessage } from "../api/auth";

export default function FaceEnrollPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const aadhaarNumber = searchParams.get("aadhaar") || "";

  /* Camera */
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraMode, setCameraMode] = useState<"camera" | "upload">("camera");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");

  /* File */
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  /* Submission */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* Cleanup stream on unmount */
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  useEffect(() => () => stopCamera(), []);

  const startCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch {
      setCameraError(
        "Camera access denied or unavailable. Please use file upload instead."
      );
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const captured = new File([blob], "face-capture.jpg", { type: "image/jpeg" });
        setFile(captured);
        setPreview(URL.createObjectURL(blob));
        stopCamera();
      },
      "image/jpeg",
      0.92
    );
  };

  const retake = () => {
    setFile(null);
    setPreview(null);
    setError("");
    if (cameraMode === "camera") startCamera();
  };

  const switchMode = (mode: "camera" | "upload") => {
    stopCamera();
    setFile(null);
    setPreview(null);
    setCameraError("");
    setError("");
    setCameraMode(mode);
  };

  const uploadFace = async () => {
    if (!aadhaarNumber) {
      setError("Aadhaar number not found. Please complete registration again.");
      return;
    }
    if (!file) {
      setError("Please capture or upload a face image.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await authApi.enrollFace(aadhaarNumber, file);
      setSuccess("Face enrolled successfully. Redirecting to login…");
      setTimeout(() => navigate("/customer/login"), 2000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Face Enrollment"
      subtitle="Register your face for biometric verification"
    >
      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} />
        </div>
      )}
      {success && (
        <div className="mb-4">
          <Alert type="success" message={success} />
        </div>
      )}

      <div className="space-y-5">
        {/* Aadhaar (read-only) */}
        <div>
          <label className="form-label">Aadhaar Number</label>
          <input
            type="text"
            value={aadhaarNumber}
            disabled
            className="input-field bg-gray-100 text-gray-500"
          />
        </div>

        {/* Mode switcher */}
        <div className="flex rounded border border-gray-200 bg-white p-1">
          <button
            onClick={() => switchMode("camera")}
            className={`flex-1 rounded py-2.5 text-sm font-semibold transition ${
              cameraMode === "camera"
                ? "bg-canara-blue text-white shadow-sm"
                : "text-gray-600 hover:bg-canara-cream hover:text-canara-blue"
            }`}
          >
            Use Camera
          </button>
          <button
            onClick={() => switchMode("upload")}
            className={`flex-1 rounded py-2.5 text-sm font-semibold transition ${
              cameraMode === "upload"
                ? "bg-canara-blue text-white shadow-sm"
                : "text-gray-600 hover:bg-canara-cream hover:text-canara-blue"
            }`}
          >
            Upload Image
          </button>
        </div>

        {/* Instructions */}
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs text-canara-blue">
          Ensure your face is well-lit, look directly at the camera, and remove glasses or
          headwear if possible.
        </div>

        {/* Camera mode */}
        {cameraMode === "camera" && (
          <div className="space-y-4">
            {cameraError && <Alert type="error" message={cameraError} />}

            {!preview && (
              <div className="overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
                {cameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full rounded-lg"
                    style={{ maxHeight: "280px", objectFit: "cover" }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-300 text-gray-400 text-xl font-light">
                      &#9654;
                    </div>
                    <p className="text-sm font-medium text-gray-500">Camera Preview</p>
                    <p className="mt-1 text-xs text-gray-400">
                      Click "Start Camera" to enable your webcam
                    </p>
                  </div>
                )}
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />

            {preview && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">Captured Photo</p>
                <div className="flex justify-center">
                  <img
                    src={preview}
                    alt="Face Preview"
                    className="h-52 w-52 rounded-xl border-2 border-canara-blue object-cover shadow-card"
                  />
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
                  <span className="font-bold text-green-600">✓</span>
                  <span className="text-sm font-medium text-green-700">
                    Photo captured successfully
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              {!cameraActive && !preview && (
                <button onClick={startCamera} className="btn-primary flex-1">
                  Start Camera
                </button>
              )}
              {cameraActive && !preview && (
                <>
                  <button onClick={capturePhoto} className="btn-gold flex-1">
                    Capture Photo
                  </button>
                  <button onClick={stopCamera} className="btn-secondary flex-1">
                    Cancel
                  </button>
                </>
              )}
              {preview && (
                <button onClick={retake} className="btn-secondary flex-1">
                  Retake Photo
                </button>
              )}
            </div>
          </div>
        )}

        {/* Upload mode */}
        {cameraMode === "upload" && (
          <div className="space-y-4">
            <div>
              <label className="form-label">Upload Face Image</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                className="input-field cursor-pointer"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0] ?? null;
                  if (!selectedFile) {
                    setFile(null);
                    return;
                  }
                  if (!["image/jpeg", "image/jpg", "image/png"].includes(selectedFile.type)) {
                    setError("Only JPG and PNG images are allowed.");
                    return;
                  }
                  setError("");
                  setFile(selectedFile);
                  setPreview(URL.createObjectURL(selectedFile));
                }}
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Upload a clear front-facing image with good lighting.
              </p>
            </div>

            {preview && (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <img
                    src={preview}
                    alt="Face Preview"
                    className="h-52 w-52 rounded-xl border-2 border-canara-blue object-cover shadow-card"
                  />
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                  }}
                  className="btn-secondary w-full"
                >
                  Remove &amp; Choose Another
                </button>
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={uploadFace}
          disabled={loading || !file}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Enrolling…" : "Enroll Face"}
        </button>
      </div>
    </AuthLayout>
  );
}
