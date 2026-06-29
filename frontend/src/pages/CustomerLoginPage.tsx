import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Webcam from "react-webcam";
import AuthLayout from "../components/AuthLayout";
import Alert from "../components/Alert";
import { authApi, getErrorMessage } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { customerLoginSchema, CustomerLoginForm } from "../lib/validation";

type LoginStep = "LOGIN" | "OTP" | "FACE";

export default function CustomerLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [step, setStep] = useState<LoginStep>("LOGIN");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [tokenData, setTokenData] = useState<any>(null);
  const [otpCode, setOtpCode] = useState("");
  const webcamRef = useRef<Webcam>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<CustomerLoginForm>({
    resolver: zodResolver(customerLoginSchema),
  });

  const onLoginSubmit = async (data: CustomerLoginForm) => {
    setError("");
    setLoading(true);
    try {
      const res = await authApi.customerLogin(data);
      // Instead of logging in immediately, save token and move to OTP
      setTokenData(res.data);
      setStep("OTP");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 4) {
      setError("Enter valid OTP");
      return;
    }
    setError("");
    setStep("FACE");
  };

  const onVerifyFace = () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setError("Could not capture image. Ensure webcam is active.");
      return;
    }
    
    // Complete the simulated flow and actually log the user in
    setLoading(true);
    setTimeout(() => {
      login(tokenData);
      navigate("/customer/dashboard");
    }, 1500); // Simulate network delay for face verification
  };

  return (
    <AuthLayout title="Customer Login" subtitle="Access your VeriTrust account securely">
        {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

        {step === "LOGIN" && (
          <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-4">
            <div>
              <label htmlFor="identifier" className="form-label">Email or Mobile Number</label>
              <input
                id="identifier"
                className="input-field"
                placeholder="email@example.com or 9876543210"
                {...register("identifier")}
              />
              {errors.identifier && <p className="form-error">{errors.identifier.message}</p>}
            </div>
            <div>
              <label htmlFor="password" className="form-label">Password</label>
              <input id="password" type="password" className="input-field" {...register("password")} />
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        )}

        {step === "OTP" && (
          <form onSubmit={onVerifyOTP} className="space-y-4">
             <div className="rounded-md bg-blue-50 p-4 mb-4">
               <p className="text-sm text-blue-700">
                 A verification code has been sent to your registered email/mobile.
               </p>
             </div>
             <div>
              <label className="form-label">Authentication Code</label>
              <input
                type="text"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value)}
                className="input-field text-center tracking-widest text-lg"
                placeholder="000000"
                maxLength={6}
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              Verify OTP
            </button>
          </form>
        )}

        {step === "FACE" && (
          <div className="space-y-4 flex flex-col items-center">
             <div className="rounded-md bg-indigo-50 p-4 mb-4 w-full">
               <p className="text-sm text-indigo-700 font-medium">Final Step: Facial Recognition</p>
               <p className="text-xs text-indigo-600 mt-1">Please ensure your face is well-lit.</p>
             </div>
             
             <div className="rounded-lg overflow-hidden border-4 border-indigo-100 shadow-md">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ width: 320, height: 240, facingMode: "user" }}
                  className="w-full max-w-sm"
                />
             </div>
             
            <button onClick={onVerifyFace} disabled={loading} className="btn-primary w-full mt-4 flex justify-center items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {loading ? "Processing..." : "Capture & Verify Face"}
            </button>
          </div>
        )}

        {step === "LOGIN" && (
          <p className="mt-6 text-center text-sm text-gray-600">
            New customer?{" "}
            <Link to="/customer/register" className="font-medium text-canara-blue hover:underline">
              Register here
            </Link>
          </p>
        )}
    </AuthLayout>
  );
}
