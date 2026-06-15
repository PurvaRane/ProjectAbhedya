import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import CanaraHeader from "../components/CanaraHeader";
import CanaraFooter from "../components/CanaraFooter";
import Alert from "../components/Alert";
import OTPInput from "../components/OTPInput";
import ResendTimer from "../components/ResendTimer";
import { authApi, getErrorMessage } from "../api/auth";

/* ─── Step Config ─────────────────────────────────────────────────────── */
const STEPS = [
  { n: 1, label: "Personal Details" },
  { n: 2, label: "KYC Documents" },
  { n: 3, label: "Face Setup" },
  { n: 4, label: "Account Setup" },
  { n: 5, label: "Review & Submit" },
];

/* ─── Static Data ─────────────────────────────────────────────────────── */
const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman & Nicobar Islands","Chandigarh","Dadra & Nagar Haveli",
  "Daman and Diu","Delhi","Jammu & Kashmir","Ladakh","Lakshadweep","Puducherry",
];

const ACCOUNT_TYPES = [
  "Savings Account","Current Account","Salary Account",
  "Fixed Deposit Account","Recurring Deposit Account",
];

/* ─── Password helpers ────────────────────────────────────────────────── */
const PWD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter (A–Z)", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Number (0–9)",           test: (p: string) => /\d/.test(p) },
  { label: "Special character",      test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];
const STRENGTH = [
  { label: "",       bar: "bg-gray-200",   text: "" },
  { label: "Weak",   bar: "bg-red-500",    text: "text-red-600" },
  { label: "Fair",   bar: "bg-orange-400", text: "text-orange-600" },
  { label: "Good",   bar: "bg-yellow-400", text: "text-yellow-600" },
  { label: "Strong", bar: "bg-green-500",  text: "text-green-600" },
] as const;
const pwdScore = (p: string) => PWD_RULES.filter(r => r.test(p)).length;

/* ─── Inline SVG icons ────────────────────────────────────────────────── */
const IconUser = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconDoc = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="2" width="18" height="20" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/>
  </svg>
);
const IconCam = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
  </svg>
);
const IconLock = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconReview = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);
const STEP_ICONS = [IconUser, IconDoc, IconCam, IconLock, IconReview];

const CheckSvg = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

/* ─── Reusable field-row helpers ──────────────────────────────────────── */
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      {children}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

function ReviewSection({
  title,
  badge,
  onEdit,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-canara-blue">{title}</h3>
        {badge}
        {onEdit && (
          <button onClick={onEdit} className="text-xs font-medium text-canara-blue hover:underline">
            Edit
          </button>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────── */
export default function CustomerOnboardingPage() {
  const navigate = useNavigate();

  /* Global */
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [done, setDone] = useState(false);

  /* Step 1 – Personal Details */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [dob, setDob]             = useState("");
  const [gender, setGender]       = useState("");
  const [email, setEmail]         = useState("");
  const [mobile, setMobile]       = useState("");
  const [address, setAddress]     = useState("");
  const [city, setCity]           = useState("");
  const [stateVal, setStateVal]   = useState("");
  const [pin, setPin]             = useState("");
  const [s1Err, setS1Err] = useState<Record<string, string>>({});

  /* Step 2 – KYC */
  const [aadhaar, setAadhaar]           = useState("");
  const [pan, setPan]                   = useState("");
  const [aadhaarPhase, setAadhaarPhase] = useState<"input" | "otp" | "done">("input");
  const [aadhaarOtp, setAadhaarOtp]     = useState("");
  const [s2Err, setS2Err] = useState<Record<string, string>>({});

  /* Step 3 – Face */
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [faceMode, setFaceMode]       = useState<"camera" | "upload">("camera");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError]   = useState("");
  const [faceFile, setFaceFile]         = useState<File | null>(null);
  const [facePreview, setFacePreview]   = useState<string | null>(null);

  /* Step 4 – Account */
  const [accountType, setAccountType] = useState("");
  const [branch, setBranch]           = useState("");
  const [nominee, setNominee]         = useState("");
  const [password, setPassword]       = useState("");
  const [confirmPwd, setConfirmPwd]   = useState("");
  const [showPwd, setShowPwd]         = useState(false);
  const [showCPwd, setShowCPwd]       = useState(false);
  const [s4Err, setS4Err] = useState<Record<string, string>>({});

  /* Step 5 */
  const [declaration, setDeclaration] = useState(false);

  const score    = pwdScore(password);
  const strength = STRENGTH[score];

  /* Camera cleanup */
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  };
  useEffect(() => () => stopCamera(), []);

  const clearAlerts = () => { setError(""); setSuccess(""); };
  const goStep = (n: number) => { clearAlerts(); setStep(n); };

  /* ── Camera ─────────────────────────────────────────────────────────── */
  const startCamera = async () => {
  setCameraError("");

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user",
      },
    });

    streamRef.current = stream;

    setCameraActive(true);

    setTimeout(() => {
      if (!videoRef.current) {
        console.error("videoRef is null");
        return;
      }

      videoRef.current.srcObject = stream;

      videoRef.current.onloadedmetadata = async () => {
        try {
          await videoRef.current?.play();

          console.log(
            "Video ready:",
            videoRef.current?.videoWidth,
            videoRef.current?.videoHeight
          );
        } catch (err) {
          console.error(err);
        }
      };
    }, 300);
  } catch (err) {
    console.error(err);

    setCameraError(
      "Camera access denied or unavailable. Please switch to file upload."
    );
  }
};
const retakePhoto = async () => {
  setFaceFile(null);
  setFacePreview(null);
  setError("");
  clearAlerts();

  if (faceMode === "camera") {
    await startCamera();
  }
};

  const capturePhoto = async () => {
  const video = videoRef.current;
  const canvas = canvasRef.current;

  if (!video || !canvas) return;

  if (video.readyState < 2) {
    setError("Camera is still loading. Please wait a moment.");
    return;
  }

  console.log(
    "Video dimensions:",
    video.videoWidth,
    video.videoHeight
  );

  if (!video.videoWidth || !video.videoHeight) {
    setError("Camera stream not initialized.");
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  ctx.drawImage(
    video,
    0,
    0,
    canvas.width,
    canvas.height
  );

  canvas.toBlob(
    (blob) => {
      if (!blob) return;

      const file = new File(
        [blob],
        "face-capture.jpg",
        {
          type: "image/jpeg",
        }
      );

      setFaceFile(file);
      setFacePreview(
        URL.createObjectURL(blob)
      );

      stopCamera();
    },
    "image/jpeg",
    0.92
  );
};

  /* ── Step 1 ──────────────────────────────────────────────────────────── */
  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim() || firstName.trim().length < 2)
      e.firstName = "First name is required (min 2 characters)";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = "Enter a valid email address";
    if (!/^[6-9]\d{9}$/.test(mobile))
      e.mobile = "Enter a valid 10-digit mobile number";
    setS1Err(e);
    return !Object.keys(e).length;
  };

  /* ── Step 2: Aadhaar OTP ─────────────────────────────────────────────── */
  const validateStep2Fields = () => {
    const e: Record<string, string> = {};
    if (aadhaar.length !== 12) e.aadhaar = "Aadhaar must be exactly 12 digits";
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase()))
      e.pan = "Invalid PAN format (e.g. ABCDE1234F)";
    setS2Err(e);
    return !Object.keys(e).length;
  };

  const sendAadhaarOTP = async () => {
    if (!validateStep2Fields()) return;
    clearAlerts();
    setLoading(true);
    try {
      await authApi.sendAadhaarOTP({ aadhaar_number: aadhaar, mobile_number: mobile });
      setSuccess(`OTP sent to +91 ${mobile}. Check your SMS inbox.`);
      setAadhaarPhase("otp");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const verifyAadhaarOTP = async () => {
    if (aadhaarOtp.length !== 6) { setError("Enter the 6-digit OTP."); return; }
    clearAlerts();
    setLoading(true);
    try {
      await authApi.verifyAadhaarOTP({
        aadhaar_number: aadhaar,
        mobile_number: mobile,
        otp_code: aadhaarOtp,
      });
      setAadhaarPhase("done");
      setSuccess("Aadhaar verified successfully!");
      setTimeout(() => { clearAlerts(); goStep(3); }, 900);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 4 ──────────────────────────────────────────────────────────── */
  const validateStep4 = () => {
    const e: Record<string, string> = {};
    if (score < 4) e.password  = "Password must satisfy all four requirements.";
    if (password !== confirmPwd) e.confirmPwd = "Passwords do not match.";
    setS4Err(e);
    return !Object.keys(e).length;
  };

  /* ── Submit ──────────────────────────────────────────────────────────── */
  const submitRegistration = async () => {
    clearAlerts();
    setLoading(true);
    try {
      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
      await authApi.completeAadhaarRegistration({
        aadhaar_number:   aadhaar,
        mobile_number:    mobile,
        full_name:        fullName,
        email:            email.trim(),
        pan_number:       pan.toUpperCase(),
        password,
        confirm_password: confirmPwd,
      });
      if (faceFile) await authApi.enrollFace(aadhaar, faceFile);
      setDone(true);
      setSuccess("Registration complete! Redirecting to login…");
      setTimeout(() => navigate("/customer/login"), 2500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /* ── Helpers ─────────────────────────────────────────────────────────── */
  const maskAadhaar = (a: string) =>
    a.length === 12 ? `XXXX XXXX ${a.slice(8)}` : a;

  const fullAddress = [address, city, stateVal, pin ? `- ${pin}` : ""]
    .filter(Boolean).join(", ");

  /* ─────────────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────────────── */
  return (
    <div className="flex min-h-screen flex-col bg-canara-gray">
      <CanaraHeader variant="auth" />

      <main className="flex flex-1 flex-col items-center px-4 py-8 sm:px-6 lg:px-8">

        {/* ══ STEPPER ════════════════════════════════════════════════════ */}
        <div className="mb-8 w-full max-w-3xl">
          {/* Desktop */}
          <div className="hidden sm:block">
            <div className="relative flex items-start justify-between">
              {/* Full-width background connector line */}
              <div
                className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200"
                style={{ zIndex: 0 }}
              />
              {/* Completed portion of connector */}
              <div
                className="absolute top-5 left-0 h-0.5 bg-canara-blue transition-all duration-500"
                style={{
                  width: step > 1
                    ? `${((step - 1) / (STEPS.length - 1)) * 100}%`
                    : "0%",
                  zIndex: 1,
                }}
              />
              {STEPS.map((s, i) => {
                const StepIcon = STEP_ICONS[i];
                const completed = step > s.n;
                const current   = step === s.n;
                return (
                  <div
                    key={s.n}
                    className="relative flex flex-1 flex-col items-center"
                    style={{ zIndex: 2 }}
                  >
                    {/* Circle */}
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300 ${
                        completed
                          ? "border-canara-blue bg-canara-blue text-white"
                          : current
                          ? "border-canara-gold bg-canara-gold text-canara-blue-dark"
                          : "border-gray-300 bg-white text-gray-400"
                      }`}
                    >
                      {completed ? <CheckSvg /> : <span>{s.n}</span>}
                    </div>
                    {/* Label */}
                    <span
                      className={`mt-2 text-center text-xs font-medium leading-tight ${
                        completed
                          ? "text-canara-blue"
                          : current
                          ? "font-semibold text-canara-blue"
                          : "text-gray-400"
                      }`}
                    >
                      {s.label}
                    </span>
                    {/* Icon badge for current step */}
                    {current && (
                      <span className="mt-1 text-canara-blue opacity-60">
                        <StepIcon />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile */}
          <div className="sm:hidden space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-canara-blue">
                Step {step} of {STEPS.length}
              </span>
              <span className="text-sm font-medium text-gray-600">
                {STEPS[step - 1].label}
              </span>
            </div>
            <div className="flex gap-1">
              {STEPS.map(s => (
                <div
                  key={s.n}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    step > s.n
                      ? "bg-canara-blue"
                      : step === s.n
                      ? "bg-canara-gold"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ══ STEP CARD ══════════════════════════════════════════════════ */}
        <div className="w-full max-w-3xl">
          <div className="auth-card">
            {/* Alerts */}
            {error   && <div className="mb-5"><Alert type="error"   message={error}   /></div>}
            {success && <div className="mb-5"><Alert type="success" message={success} /></div>}

            {/* ════════════════════════════════════════════════════════════
                STEP 1 – Personal Details
            ════════════════════════════════════════════════════════════ */}
            {step === 1 && (
              <div>
                {/* Section header */}
                <div className="mb-6 flex items-start gap-3 border-b border-gray-100 pb-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-canara-blue">
                    <IconUser />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-canara-blue">Personal Information</h2>
                    <p className="text-sm text-gray-500">Your basic details as per official records</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                  <Field label="First Name" error={s1Err.firstName}>
                    <input
                      className="input-field"
                      placeholder="As per Aadhaar"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                    />
                  </Field>
                  <Field label="Last Name">
                    <input
                      className="input-field"
                      placeholder="As per Aadhaar"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                    />
                  </Field>
                  <Field label="Date of Birth">
                    <input
                      type="date"
                      className="input-field"
                      value={dob}
                      onChange={e => setDob(e.target.value)}
                    />
                  </Field>
                  <Field label="Gender">
                    <select
                      className="input-field"
                      value={gender}
                      onChange={e => setGender(e.target.value)}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </Field>
                  <Field label="Email Address" error={s1Err.email}>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="yourname@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </Field>
                  <Field label="Mobile Number" error={s1Err.mobile}>
                    <input
                      type="tel"
                      className="input-field"
                      placeholder="10-digit number"
                      maxLength={10}
                      value={mobile}
                      onChange={e => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Residential Address">
                      <input
                        className="input-field"
                        placeholder="House/Flat No., Street, Area"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                      />
                    </Field>
                  </div>
                  <Field label="City">
                    <input
                      className="input-field"
                      placeholder="City"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                    />
                  </Field>
                  <Field label="State">
                    <select
                      className="input-field"
                      value={stateVal}
                      onChange={e => setStateVal(e.target.value)}
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="PIN Code">
                    <input
                      className="input-field"
                      placeholder="6-digit PIN"
                      maxLength={6}
                      value={pin}
                      onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    />
                  </Field>
                </div>

                <div className="mt-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                  <p className="text-sm text-gray-500">
                    Already registered?{" "}
                    <Link to="/customer/login" className="font-medium text-canara-blue hover:underline">
                      Login here
                    </Link>
                  </p>
                  <button
                    onClick={() => { if (validateStep1()) goStep(2); }}
                    className="btn-primary w-full sm:w-auto"
                  >
                    Next: KYC Documents &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════
                STEP 2 – KYC Documents
            ════════════════════════════════════════════════════════════ */}
            {step === 2 && (
              <div>
                <div className="mb-6 flex items-start gap-3 border-b border-gray-100 pb-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-canara-blue">
                    <IconDoc />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-canara-blue">KYC Documents</h2>
                    <p className="text-sm text-gray-500">
                      Required for RBI compliance and identity verification
                    </p>
                  </div>
                </div>

                {/* ── Enter Aadhaar + PAN ── */}
                {aadhaarPhase === "input" && (
                  <div className="space-y-4">
                    <Field label="Aadhaar Number" error={s2Err.aadhaar}>
                      <input
                        className="input-field tracking-widest"
                        placeholder="XXXX XXXX XXXX"
                        maxLength={12}
                        value={aadhaar}
                        onChange={e => setAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12))}
                      />
                    </Field>
                    <Field label="PAN Number" error={s2Err.pan}>
                      <input
                        className="input-field uppercase tracking-widest"
                        placeholder="ABCDE1234F"
                        maxLength={10}
                        value={pan}
                        onChange={e => setPan(e.target.value.toUpperCase())}
                      />
                    </Field>

                    <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-canara-blue">
                      <strong>Note:</strong> Your Aadhaar is used for UIDAI e-KYC verification
                      only. We do not store biometric data. All documents are encrypted with
                      AES-256.
                    </div>

                    <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-between">
                      <button onClick={() => goStep(1)} className="btn-secondary w-full sm:w-auto">
                        &larr; Back
                      </button>
                      <button
                        onClick={sendAadhaarOTP}
                        disabled={loading}
                        className="btn-primary w-full sm:w-auto"
                      >
                        {loading ? "Sending OTP…" : "Next: Account Setup →"}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── OTP Entry ── */}
                {aadhaarPhase === "otp" && (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                      OTP sent to{" "}
                      <strong>+91&nbsp;{mobile}</strong>. Check your SMS inbox.
                    </div>
                    <Field label="Enter 6-Digit OTP">
                      <OTPInput value={aadhaarOtp} onChange={setAadhaarOtp} disabled={loading} />
                    </Field>
                    <ResendTimer seconds={300} disabled={loading} onResend={sendAadhaarOTP} />
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                      <button
                        onClick={() => {
                          setAadhaarPhase("input");
                          setAadhaarOtp("");
                          clearAlerts();
                        }}
                        className="btn-secondary w-full sm:w-auto"
                      >
                        Change Aadhaar
                      </button>
                      <button
                        onClick={verifyAadhaarOTP}
                        disabled={loading || aadhaarOtp.length !== 6}
                        className="btn-primary w-full sm:w-auto"
                      >
                        {loading ? "Verifying…" : "Verify OTP"}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Verified ── */}
                {aadhaarPhase === "done" && (
                  <div className="flex flex-col items-center gap-4 py-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <CheckSvg className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-700">Aadhaar Verified</p>
                      <p className="mt-0.5 text-sm text-green-600 tracking-wider">{maskAadhaar(aadhaar)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════
                STEP 3 – Face Registration
            ════════════════════════════════════════════════════════════ */}
            {step === 3 && (
              <div>
                <div className="mb-6 flex items-start gap-3 border-b border-gray-100 pb-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-canara-blue">
                    <IconCam />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-canara-blue">Face Registration</h2>
                    <p className="text-sm text-gray-500">
                      Biometric verification for secure account access
                    </p>
                  </div>
                </div>

                {/* Mode switcher */}
                <div className="mb-4 flex rounded border border-gray-200 bg-white p-1">
                  {(["camera", "upload"] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => {
                        if (faceMode === mode) return;
                        stopCamera();
                        setFaceMode(mode);
                        setFaceFile(null);
                        setFacePreview(null);
                        setCameraError("");
                        clearAlerts();
                      }}
                      className={`flex-1 rounded py-2.5 text-sm font-semibold transition ${
                        faceMode === mode
                          ? "bg-canara-blue text-white shadow-sm"
                          : "text-gray-600 hover:bg-canara-cream hover:text-canara-blue"
                      }`}
                    >
                      {mode === "camera" ? "Use Camera" : "Upload Image"}
                    </button>
                  ))}
                </div>

                <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-canara-blue">
                  <strong>Instructions:&nbsp;</strong>
                  Ensure good lighting, look directly at the camera, and remove glasses or
                  headwear if possible.
                </div>

                {/* Camera mode */}
                {faceMode === "camera" && (
                  <div className="space-y-4">
                    {cameraError && <Alert type="error" message={cameraError} />}

                    {!facePreview && (
                      <div className="overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
                        {cameraActive ? (
                          <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              onLoadedMetadata={() => {
                                console.log(
                                  "VIDEO READY",
                                  videoRef.current?.videoWidth,
                                  videoRef.current?.videoHeight
                                );
                              }}
                              className="w-full rounded-xl"
                              style={{ maxHeight: "300px", objectFit: "cover" }}
                            />
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-gray-300 text-gray-300">
                              <IconCam />
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

                    {facePreview && (
                      <div className="space-y-3">
                        <div className="flex justify-center">
                          <img
                            src={facePreview}
                            alt="Captured face"
                            className="h-52 w-52 rounded-xl border-2 border-canara-blue object-cover shadow-card"
                          />
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
                          <CheckSvg className="h-4 w-4 shrink-0 text-green-600" />
                          <span className="text-sm font-medium text-green-700">
                            Photo captured successfully
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-2 sm:flex-row">
                      {!cameraActive && !facePreview && (
                        <button onClick={startCamera} className="btn-primary flex-1">
                          Start Camera
                        </button>
                      )}
                      {cameraActive && !facePreview && (
                        <>
                          <button onClick={capturePhoto} className="btn-gold flex-1">
                            Capture Photo
                          </button>
                          <button onClick={stopCamera} className="btn-secondary flex-1">
                            Cancel
                          </button>
                        </>
                      )}
                      {facePreview && (
                        <button onClick={retakePhoto} className="btn-secondary flex-1">
                          Retake Photo
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Upload mode */}
                {faceMode === "upload" && (
                  <div className="space-y-4">
                    <Field label="Upload Face Photo">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        className="input-field cursor-pointer"
                        onChange={e => {
                          const f = e.target.files?.[0] ?? null;
                          if (!f) return;
                          if (!["image/jpeg", "image/jpg", "image/png"].includes(f.type)) {
                            setError("Only JPG and PNG images are allowed.");
                            return;
                          }
                          clearAlerts();
                          setFaceFile(f);
                          setFacePreview(URL.createObjectURL(f));
                        }}
                      />
                    </Field>
                    <p className="text-xs text-gray-500">
                      Use a clear, front-facing photo with good lighting. JPG or PNG only.
                    </p>
                    {facePreview && (
                      <div className="space-y-3">
                        <div className="flex justify-center">
                          <img
                            src={facePreview}
                            alt="Face preview"
                            className="h-52 w-52 rounded-xl border-2 border-canara-blue object-cover shadow-card"
                          />
                        </div>
                        <button
                          onClick={() => { setFaceFile(null); setFacePreview(null); }}
                          className="btn-secondary w-full"
                        >
                          Remove &amp; Choose Another
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between">
                  <button
                    onClick={() => { stopCamera(); goStep(2); }}
                    className="btn-secondary w-full sm:w-auto"
                  >
                    &larr; Back
                  </button>
                  <button
                    onClick={() => {
                      if (!faceFile) {
                        setError("Please capture or upload your face photo before continuing.");
                        return;
                      }
                      clearAlerts();
                      stopCamera();
                      goStep(4);
                    }}
                    disabled={!faceFile}
                    className="btn-primary w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next: Account Setup &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════
                STEP 4 – Account Setup
            ════════════════════════════════════════════════════════════ */}
            {step === 4 && (
              <div>
                <div className="mb-6 flex items-start gap-3 border-b border-gray-100 pb-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-canara-blue">
                    <IconLock />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-canara-blue">Account Preferences</h2>
                    <p className="text-sm text-gray-500">
                      Choose your account type and set login credentials
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Field label="Account Type">
                    <select
                      className="input-field"
                      value={accountType}
                      onChange={e => setAccountType(e.target.value)}
                    >
                      <option value="">Select account type</option>
                      {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>

                  <Field label="Preferred Branch">
                    <input
                      className="input-field"
                      placeholder="Enter preferred branch name or IFSC"
                      value={branch}
                      onChange={e => setBranch(e.target.value)}
                    />
                  </Field>

                  <Field label="Nominee Name">
                    <input
                      className="input-field"
                      placeholder="Full name of nominee (optional)"
                      value={nominee}
                      onChange={e => setNominee(e.target.value)}
                    />
                  </Field>

                  <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                    <div>
                      <label className="form-label">Internet Banking Password</label>
                      <div className="relative">
                        <input
                          type={showPwd ? "text" : "password"}
                          className="input-field pr-16"
                          placeholder="Min 8 characters"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowPwd(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 select-none text-xs font-medium text-gray-400 hover:text-gray-600"
                        >
                          {showPwd ? "Hide" : "Show"}
                        </button>
                      </div>

                      {password && (
                        <div className="mt-2 space-y-1.5">
                          {/* Strength bars */}
                          <div className="flex gap-1">
                            {[1, 2, 3, 4].map(n => (
                              <div
                                key={n}
                                className={`h-1.5 flex-1 rounded-full transition-all ${
                                  score >= n ? strength.bar : "bg-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                          {strength.label && (
                            <p className={`text-xs font-semibold ${strength.text}`}>
                              Strength: {strength.label}
                            </p>
                          )}
                          <ul className="space-y-0.5">
                            {PWD_RULES.map(r => {
                              const ok = r.test(password);
                              return (
                                <li
                                  key={r.label}
                                  className={`flex items-center gap-1.5 text-xs ${
                                    ok ? "text-green-600" : "text-gray-400"
                                  }`}
                                >
                                  {ok
                                    ? <CheckSvg className="h-3 w-3 shrink-0" />
                                    : <span className="h-3 w-3 shrink-0">○</span>
                                  }
                                  {r.label}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                      {s4Err.password && <p className="form-error">{s4Err.password}</p>}
                    </div>

                    <div>
                      <label className="form-label">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showCPwd ? "text" : "password"}
                          className="input-field pr-16"
                          placeholder="Re-enter password"
                          value={confirmPwd}
                          onChange={e => setConfirmPwd(e.target.value)}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowCPwd(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 select-none text-xs font-medium text-gray-400 hover:text-gray-600"
                        >
                          {showCPwd ? "Hide" : "Show"}
                        </button>
                      </div>
                      {confirmPwd && password === confirmPwd && (
                        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-green-600">
                          <CheckSvg className="h-3 w-3" /> Passwords match
                        </p>
                      )}
                      {confirmPwd && password !== confirmPwd && (
                        <p className="form-error">Passwords do not match</p>
                      )}
                      {s4Err.confirmPwd && <p className="form-error">{s4Err.confirmPwd}</p>}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between">
                  <button onClick={() => goStep(3)} className="btn-secondary w-full sm:w-auto">
                    &larr; Back
                  </button>
                  <button
                    onClick={() => { if (validateStep4()) goStep(5); }}
                    className="btn-primary w-full sm:w-auto"
                  >
                    Review Application &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════
                STEP 5 – Review & Submit
            ════════════════════════════════════════════════════════════ */}
            {step === 5 && !done && (
              <div>
                <div className="mb-6 flex items-start gap-3 border-b border-gray-100 pb-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-canara-blue">
                    <IconReview />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-canara-blue">Review Your Application</h2>
                    <p className="text-sm text-gray-500">
                      Verify all details before final submission
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Personal Details */}
                  <ReviewSection
                    title="Personal Details"
                    onEdit={() => goStep(1)}
                  >
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-gray-500">Full Name</dt>
                        <dd className="font-semibold">
                          {[firstName, lastName].filter(Boolean).join(" ")}
                        </dd>
                      </div>
                      {dob && (
                        <div>
                          <dt className="text-gray-500">Date of Birth</dt>
                          <dd className="font-semibold">{dob}</dd>
                        </div>
                      )}
                      {gender && (
                        <div>
                          <dt className="text-gray-500">Gender</dt>
                          <dd className="font-semibold capitalize">
                            {gender.replace(/_/g, " ")}
                          </dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-gray-500">Email</dt>
                        <dd className="break-all font-semibold">{email}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Mobile</dt>
                        <dd className="font-semibold">{mobile}</dd>
                      </div>
                      {fullAddress && (
                        <div className="sm:col-span-2">
                          <dt className="text-gray-500">Address</dt>
                          <dd className="font-semibold">{fullAddress}</dd>
                        </div>
                      )}
                    </dl>
                  </ReviewSection>

                  {/* KYC */}
                  <ReviewSection
                    title="KYC Documents"
                    badge={
                      <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                        <CheckSvg className="h-3.5 w-3.5" />
                        Aadhaar Verified
                      </span>
                    }
                  >
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-gray-500">Aadhaar Number</dt>
                        <dd className="font-semibold tracking-wider">{maskAadhaar(aadhaar)}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">PAN Number</dt>
                        <dd className="font-semibold uppercase tracking-widest">{pan}</dd>
                      </div>
                    </dl>
                  </ReviewSection>

                  {/* Face */}
                  {facePreview && (
                    <ReviewSection title="Face Registration" onEdit={() => goStep(3)}>
                      <div className="flex items-center gap-4">
                        <img
                          src={facePreview}
                          alt="Face"
                          className="h-16 w-16 shrink-0 rounded-lg border border-gray-200 object-cover shadow-sm"
                        />
                        <div>
                          <p className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                            <CheckSvg className="h-4 w-4" />
                            Face image ready for enrollment
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            Will be enrolled upon successful registration
                          </p>
                        </div>
                      </div>
                    </ReviewSection>
                  )}

                  {/* Account Preferences */}
                  <ReviewSection title="Account Preferences" onEdit={() => goStep(4)}>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-gray-500">Account Type</dt>
                        <dd className="font-semibold">{accountType || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Preferred Branch</dt>
                        <dd className="font-semibold">{branch || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Nominee</dt>
                        <dd className="font-semibold">{nominee || "Not specified"}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Login ID</dt>
                        <dd className="break-all font-semibold">{email}</dd>
                      </div>
                    </dl>
                  </ReviewSection>

                  {/* Declaration */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 shrink-0 accent-canara-blue"
                        checked={declaration}
                        onChange={e => setDeclaration(e.target.checked)}
                      />
                      <span className="text-sm text-gray-600">
                        I hereby declare that the information provided is true and correct. I
                        agree to the{" "}
                        <span className="font-medium text-canara-blue">Terms &amp; Conditions</span>,{" "}
                        <span className="font-medium text-canara-blue">Privacy Policy</span>, and{" "}
                        <span className="font-medium text-canara-blue">
                          Canara Bank Account Opening Agreement
                        </span>
                        . I consent to Aadhaar-based e-KYC verification as per UIDAI guidelines.
                      </span>
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between">
                  <button onClick={() => goStep(4)} className="btn-secondary w-full sm:w-auto">
                    &larr; Edit
                  </button>
                  <button
                    onClick={submitRegistration}
                    disabled={loading || !declaration}
                    className="btn-primary w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "Creating Account…" : "Submit Application ✓"}
                  </button>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════
                SUCCESS
            ════════════════════════════════════════════════════════════ */}
            {done && (
              <div className="py-10 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <CheckSvg className="h-8 w-8" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-green-700">Registration Successful!</h2>
                <p className="text-sm text-gray-600">
                  Your account has been created and your face enrolled for biometric access.
                </p>
                <p className="mt-2 text-sm text-gray-400">Redirecting to login…</p>
              </div>
            )}
          </div>
        </div>

        {!done && step > 1 && (
          <p className="mt-6 text-center text-sm text-gray-600">
            Already registered?{" "}
            <Link to="/customer/login" className="font-medium text-canara-blue hover:underline">
              Login here
            </Link>
          </p>
        )}
      </main>

      <CanaraFooter />
    </div>
  );
}
