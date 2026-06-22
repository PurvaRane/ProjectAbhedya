import { useState } from "react";

const flowSteps = [
  { label: "Password\nVerified", done: true, icon: "🔑" },
  { label: "OTP\nSent", done: true, icon: "📤" },
  { label: "OTP\nVerified", done: true, icon: "✅" },
  { label: "Access\nGranted", done: true, icon: "🔓" },
];

export default function MFACenter() {
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const handleOtpChange = (val: string, idx: number) => {
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) {
      const el = document.getElementById(`otp-mfa-${idx + 1}`);
      el?.focus();
    }
  };

  return (
    <div>
      <h2 className="section-heading">Multi-Factor Authentication</h2>

      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        {/* MFA Status Card */}
        <div className="dash-card lg:col-span-2">
          <div className="dash-card-header">
            <h3 className="font-bold text-canara-blue">MFA Configuration</h3>
            <span className={mfaEnabled ? "badge-verified" : "badge-danger"}>
              {mfaEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "MFA Status", value: mfaEnabled ? "Active — TOTP + SMS" : "Disabled" },
              { label: "Registered Mobile", value: "+91 98765 ••••1" },
              { label: "Registered Email", value: "john.d••@veritrust.in" },
              { label: "Last OTP Verification", value: "Today, 10:24 AM" },
              { label: "OTP Validity", value: "5 minutes per code" },
              { label: "Failed OTP Attempts", value: "0 (last 30 days)" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-canara-gray px-4 py-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{item.label}</p>
                <p className="text-sm font-semibold text-gray-800">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="dash-card flex flex-col gap-3">
          <div className="dash-card-header">
            <h3 className="font-bold text-canara-blue">Actions</h3>
          </div>
          <button
            className={mfaEnabled ? "btn-sm-danger w-full justify-center py-2.5 text-sm" : "btn-primary w-full"}
            onClick={() => setMfaEnabled(!mfaEnabled)}
          >
            {mfaEnabled ? "Disable MFA" : "Enable MFA"}
          </button>
          <button className="btn-secondary w-full">Change Mobile Number</button>
          <button className="btn-sm-secondary w-full justify-center py-2.5" onClick={() => setShowOtpInput(!showOtpInput)}>
            {showOtpInput ? "Cancel OTP" : "Verify OTP Now"}
          </button>
          <div className={`rounded-lg p-3 border ${mfaEnabled ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <p className={`text-xs font-semibold ${mfaEnabled ? "text-green-700" : "text-red-700"}`}>
              {mfaEnabled ? "✅ MFA adds an extra security layer" : "⛔ MFA is strongly recommended"}
            </p>
          </div>
        </div>
      </div>

      {/* OTP Input */}
      {showOtpInput && (
        <div className="dash-card mb-6">
          <div className="dash-card-header">
            <h3 className="font-bold text-canara-blue">Enter OTP</h3>
            <span className="text-xs text-gray-400">Sent to +91 98765 ••••1</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">Enter the 6-digit OTP sent to your registered mobile number.</p>
          <div className="flex gap-3 mb-4">
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-mfa-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(e.target.value, i)}
                className="h-12 w-12 rounded-lg border-2 border-gray-200 text-center text-lg font-bold text-canara-blue outline-none focus:border-canara-blue transition"
              />
            ))}
          </div>
          <div className="flex gap-3">
            <button className="btn-primary px-8">Verify OTP</button>
            <button className="btn-secondary px-8" onClick={() => setShowOtpInput(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Auth Flow Diagram */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h3 className="font-bold text-canara-blue">Authentication Flow</h3>
          <span className="badge-verified">All Steps Completed</span>
        </div>
        <div className="flex items-center justify-center gap-2 py-4 flex-wrap">
          {flowSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg shadow-sm border-2 ${
                  step.done ? "bg-green-500 border-green-500 text-white" : "bg-gray-100 border-gray-200 text-gray-400"
                }`}>
                  {step.icon}
                </div>
                <p className="mt-2 text-center text-xs font-semibold text-gray-600 whitespace-pre-line">{step.label}</p>
              </div>
              {i < flowSteps.length - 1 && (
                <div className="flex flex-col items-center mb-5">
                  <div className={`h-0.5 w-8 sm:w-12 ${step.done ? "bg-green-400" : "bg-gray-200"}`}></div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
          <p className="text-sm font-semibold text-green-700">🎉 Full authentication chain verified — Access granted at 10:25 AM</p>
        </div>
      </div>
    </div>
  );
}
