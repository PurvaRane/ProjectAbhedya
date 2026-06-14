import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import AuthLayout from "../components/AuthLayout";
import Alert from "../components/Alert";

import { authApi, getErrorMessage } from "../api/auth";

export default function FaceEnrollPage() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const aadhaarNumber =
    searchParams.get("aadhaar") || "";

  const [file, setFile] =
    useState<File | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const uploadFace = async () => {
    if (!aadhaarNumber) {
      setError(
        "Aadhaar number not found. Please complete registration again."
      );
      return;
    }

    if (!file) {
      setError(
        "Please select a face image"
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      await authApi.enrollFace(
        aadhaarNumber,
        file
      );

      setSuccess(
        "Face enrolled successfully. Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/customer/login");
      }, 2000);

    } catch (err) {
      setError(
        getErrorMessage(err)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Face Enrollment"
      subtitle="Upload a clear face image for biometric verification"
    >
      {error && (
        <div className="mb-4">
          <Alert
            type="error"
            message={error}
          />
        </div>
      )}

      {success && (
        <div className="mb-4">
          <Alert
            type="success"
            message={success}
          />
        </div>
      )}

      <div className="space-y-5">

        <div>
          <label className="form-label">
            Aadhaar Number
          </label>

          <input
            type="text"
            value={aadhaarNumber}
            disabled
            className="input-field bg-gray-100"
          />
        </div>

        <div>
          <label className="form-label">
            Upload Face Image
          </label>

          <input
            type="file"
            accept=".jpg,.jpeg,.png"
            className="input-field"
            onChange={(e) => {
              const selectedFile =
                e.target.files?.[0] || null;

              if (!selectedFile) {
                setFile(null);
                return;
              }

              const allowedTypes = [
                "image/jpeg",
                "image/jpg",
                "image/png",
              ];

              if (
                !allowedTypes.includes(
                  selectedFile.type
                )
              ) {
                setError(
                  "Only JPG and PNG images are allowed"
                );
                return;
              }

              setError("");
              setFile(selectedFile);
            }}
          />

          <p className="mt-2 text-xs text-gray-500">
            Upload a clear front-facing image with good lighting.
          </p>
        </div>

        {file && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Preview
            </p>

            <img
              src={URL.createObjectURL(file)}
              alt="Face Preview"
              className="mx-auto h-56 w-56 rounded-xl border border-gray-300 object-cover shadow-sm"
            />
          </div>
        )}

        <button
          type="button"
          onClick={uploadFace}
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading
            ? "Uploading..."
            : "Enroll Face"}
        </button>
      </div>
    </AuthLayout>
  );
}