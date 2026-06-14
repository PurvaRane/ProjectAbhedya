import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthLayout from "../components/AuthLayout";
import Alert from "../components/Alert";
import OTPInput from "../components/OTPInput";

import { authApi, getErrorMessage } from "../api/auth";

export default function AadhaarRegisterPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  const [otp, setOtp] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [panNumber, setPanNumber] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const sendOtp = async () => {
    if (aadhaarNumber.length !== 12) {
      setError("Aadhaar must be exactly 12 digits");
      return;
    }

    if (mobileNumber.length !== 10) {
      setError("Mobile number must be exactly 10 digits");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await authApi.sendAadhaarOTP({
        aadhaar_number: aadhaarNumber,
        mobile_number: mobileNumber,
      });

      setSuccess("OTP sent successfully");
      setStep(2);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      setError("OTP must be 6 digits");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await authApi.verifyAadhaarOTP({
        aadhaar_number: aadhaarNumber,
        mobile_number: mobileNumber,
        otp_code: otp,
      });

      setSuccess("OTP verified successfully");
      setStep(3);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const completeRegistration = async () => {
    if (
      !fullName ||
      !email ||
      !panNumber ||
      !password ||
      !confirmPassword
    ) {
      setError("Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await authApi.completeAadhaarRegistration({
        aadhaar_number: aadhaarNumber,
        mobile_number: mobileNumber,
        full_name: fullName,
        email,
        pan_number: panNumber.toUpperCase(),
        password,
        confirm_password: confirmPassword,
      });

      setSuccess(
        "Registration successful. Redirecting to face enrollment..."
      );

      setTimeout(() => {
        navigate(
          `/aadhaar/face-enroll?aadhaar=${aadhaarNumber}`
        );
      }, 1000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Aadhaar Registration"
      subtitle="Register using Aadhaar + Face Verification"
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

      {step === 1 && (
        <div className="space-y-4">
          <input
            className="input-field"
            placeholder="Aadhaar Number"
            maxLength={12}
            value={aadhaarNumber}
            onChange={(e) =>
              setAadhaarNumber(
                e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 12)
              )
            }
          />

          <input
            className="input-field"
            placeholder="Mobile Number"
            maxLength={10}
            value={mobileNumber}
            onChange={(e) =>
              setMobileNumber(
                e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 10)
              )
            }
          />

          <button
            className="btn-primary w-full"
            onClick={sendOtp}
            disabled={loading}
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <OTPInput
            value={otp}
            onChange={setOtp}
          />

          <button
            className="btn-primary w-full"
            onClick={verifyOtp}
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <input
            className="input-field"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) =>
              setFullName(e.target.value)
            }
          />

          <input
            className="input-field"
            placeholder="Email Address"
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <input
            className="input-field uppercase"
            placeholder="PAN Number"
            value={panNumber}
            onChange={(e) =>
              setPanNumber(
                e.target.value.toUpperCase()
              )
            }
          />

          <input
            type="password"
            className="input-field"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />

          <input
            type="password"
            className="input-field"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
          />

          <button
            className="btn-primary w-full"
            onClick={completeRegistration}
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Complete Registration"}
          </button>
        </div>
      )}
    </AuthLayout>
  );
}