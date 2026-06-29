import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Webcam from "react-webcam";
import AuthLayout from "../components/AuthLayout";
import Alert from "../components/Alert";
import { authApi, getErrorMessage } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { employeeLoginSchema, EmployeeLoginForm } from "../lib/validation";

// Generate a stable device ID
const getDeviceId = () => {
  let id = localStorage.getItem("veritrust_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("veritrust_device_id", id);
  }
  return id;
};

type LoginStep = "LOGIN" | "OTP" | "FACE";

export default function EmployeeLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // State Machine
  const [step, setStep] = useState<LoginStep>("LOGIN");
  const [email, setEmail] = useState("");
  
  // UI State
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  
  // CAPTCHA State
  const [captcha, setCaptcha] = useState<{question: string, token: string} | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  
  // Behavioral tracking
  const [startTime] = useState(Date.now());
  const [clicks, setClicks] = useState(0);
  
  // OTP State
  const [otpCode, setOtpCode] = useState("");
  
  // Face Verification State
  const webcamRef = useRef<Webcam>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<EmployeeLoginForm>({
    resolver: zodResolver(employeeLoginSchema),
  });

  // Track clicks for behavioral scoring
  useEffect(() => {
    const handleClick = () => setClicks(c => c + 1);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  // Fetch CAPTCHA on load
  const loadCaptcha = useCallback(async () => {
    try {
      const res = await authApi.getEmployeeCaptcha();
      setCaptcha(res.data);
      setCaptchaAnswer("");
    } catch (err) {
      console.error("Failed to load captcha", err);
    }
  }, []);

  useEffect(() => {
    loadCaptcha();
  }, [loadCaptcha]);

  const onLoginSubmit = async (data: EmployeeLoginForm) => {
    if (!captcha || !captchaAnswer.trim()) {
      setError("Please solve the math problem.");
      return;
    }
    
    setError("");
    setLoading(true);
    try {
      const timeTakenMs = Date.now() - startTime;
      setEmail(data.email);
      
      const res = await authApi.employeeLoginStep1({
        email: data.email,
        password: data.password,
        device_id: getDeviceId(),
        captcha_token: captcha.token,
        captcha_answer: captchaAnswer.trim(),
        typing_speed_ms: timeTakenMs,
        mouse_clicks: clicks
      });

      setSuccessMsg(res.data.message);
      if (res.data.next_step === "REQUIRE_OTP") {
        setStep("OTP");
      } else if (res.data.next_step === "REQUIRE_FACE") {
        setStep("FACE");
      }
    } catch (err) {
      setError(getErrorMessage(err));
      loadCaptcha(); // reload on failure
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 4) {
      setError("Enter valid OTP");
      return;
    }
    
    setError("");
    setLoading(true);
    try {
      const res = await authApi.employeeVerifyOTP({
        email,
        otp_code: otpCode,
        device_id: getDeviceId()
      });
      
      setSuccessMsg(res.data.message);
      if (res.data.next_step === "REQUIRE_FACE") {
        setStep("FACE");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onVerifyFace = async () => {
    if (!webcamRef.current) return;
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setError("Could not capture image. Ensure webcam is active.");
      return;
    }
    
    setError("");
    setLoading(true);
    try {
      const res = await authApi.employeeVerifyFace({
        email,
        image_base64: imageSrc,
        device_id: getDeviceId()
      });
      
      login(res.data);
      navigate("/employee/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Staff Secure Login" subtitle="Multi-Factor Biometric Authentication">
        <div className="mb-6 rounded bg-canara-cream p-4 text-sm text-canara-blue-dark">
          <strong>Security Notice:</strong> Your IP, device fingerprint, and behavioral telemetry are recorded.
        </div>

        {error && <div className="mb-4"><Alert type="error" message={error} /></div>}
        {successMsg && !error && <div className="mb-4"><Alert type="success" message={successMsg} /></div>}

        {step === "LOGIN" && (
          <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-4">
            <div>
              <label htmlFor="email" className="form-label">Employee Email</label>
              <input
                id="email"
                type="email"
                placeholder="name@veritrust.in"
                className="input-field"
                autoComplete="username"
                {...register("email")}
              />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>
            
            <div>
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                type="password"
                className="input-field"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>
            
            {captcha && (
              <div className="rounded-md border p-4 bg-gray-50">
                <label className="form-label text-gray-700">Prove you are human: {captcha.question}</label>
                <input
                  type="text"
                  value={captchaAnswer}
                  onChange={e => setCaptchaAnswer(e.target.value)}
                  className="input-field mt-1"
                  placeholder="Answer"
                />
              </div>
            )}
            
            <button type="submit" disabled={loading || !captcha} className="btn-primary w-full">
              {loading ? "Authenticating..." : "Next Step"}
            </button>
          </form>
        )}

        {step === "OTP" && (
          <form onSubmit={onVerifyOTP} className="space-y-4">
             <div className="rounded-md bg-blue-50 p-4 mb-4">
               <p className="text-sm text-blue-700">
                 Due to security policies (e.g. new device detected), a verification code has been sent to your email.
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
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Verifying..." : "Verify Code"}
            </button>
          </form>
        )}

        {step === "FACE" && (
          <div className="space-y-4 flex flex-col items-center">
             <div className="rounded-md bg-indigo-50 p-4 mb-4 w-full">
               <p className="text-sm text-indigo-700 font-medium">
                 Final Step: Facial Recognition
               </p>
               <p className="text-xs text-indigo-600 mt-1">
                 Please ensure your face is well-lit and clearly visible.
               </p>
             </div>
             
             <div className="rounded-lg overflow-hidden border-4 border-indigo-100 shadow-md">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    width: 320,
                    height: 240,
                    facingMode: "user"
                  }}
                  className="w-full max-w-sm"
                />
             </div>
             
            <button onClick={onVerifyFace} disabled={loading} className="btn-primary w-full mt-4 flex justify-center items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {loading ? "Processing..." : "Capture & Verify Face"}
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-gray-600">
          <Link to="/" className="font-medium text-canara-blue hover:underline">
            Cancel & Return to Home
          </Link>
        </p>
    </AuthLayout>
  );
}
