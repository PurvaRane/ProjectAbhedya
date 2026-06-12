import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthLayout from "../components/AuthLayout";
import Alert from "../components/Alert";
import OTPInput from "../components/OTPInput";
import ResendTimer from "../components/ResendTimer";
import { authApi, getErrorMessage } from "../api/auth";
import {
  emailRegisterSchema,
  emailOtpSchema,
  mobileNumberSchema,
  mobileOtpSchema,
  mobileCompleteSchema,
  EmailRegisterForm,
  EmailOtpForm,
  MobileNumberForm,
  MobileOtpForm,
  MobileCompleteForm,
} from "../lib/validation";

type Tab = "email" | "mobile";
type MobileStep = "number" | "otp" | "details";

export default function CustomerRegisterPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("mobile");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [emailStep, setEmailStep] = useState<"register" | "otp">("register");
  const [registeredEmail, setRegisteredEmail] = useState("");

  const [mobileStep, setMobileStep] = useState<MobileStep>("number");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpExpiresIn, setOtpExpiresIn] = useState(300);

  const emailForm = useForm<EmailRegisterForm>({ resolver: zodResolver(emailRegisterSchema) });
  const emailOtpForm = useForm<EmailOtpForm>({ resolver: zodResolver(emailOtpSchema) });
  const mobileForm = useForm<MobileNumberForm>({ resolver: zodResolver(mobileNumberSchema) });
  const mobileOtpForm = useForm<MobileOtpForm>({ resolver: zodResolver(mobileOtpSchema) });
  const mobileCompleteForm = useForm<MobileCompleteForm>({
    resolver: zodResolver(mobileCompleteSchema),
    defaultValues: { mobile_number: "" },
  });

  const onEmailRegister = async (data: EmailRegisterForm) => {
    setError("");
    setLoading(true);
    try {
      await authApi.registerEmail(data);
      setRegisteredEmail(data.email);
      emailOtpForm.setValue("email", data.email);
      setEmailStep("otp");
      setSuccess("OTP sent to your email. Please verify to activate your account.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onEmailVerify = async (data: EmailOtpForm) => {
    setError("");
    setLoading(true);
    try {
      await authApi.verifyEmailOTP(data);
      setSuccess("Account activated! Redirecting to login...");
      setTimeout(() => navigate("/customer/login"), 2000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onSendMobileOTP = async (data: MobileNumberForm) => {
    setError("");
    setLoading(true);
    try {
      const res = await authApi.sendMobileOTP(data);
      setMobileNumber(res.data.mobile_number);
      mobileOtpForm.setValue("mobile_number", res.data.mobile_number);
      mobileCompleteForm.setValue("mobile_number", res.data.mobile_number);
      setOtpExpiresIn(res.data.expires_in_seconds);
      setMobileStep("otp");
      setSuccess("OTP sent to your mobile number. Check your SMS inbox.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onVerifyMobileOTP = async (data: MobileOtpForm) => {
    setError("");
    setLoading(true);
    try {
      await authApi.verifyMobileOTP(data);
      setMobileStep("details");
      setSuccess("Mobile verified. Complete your registration.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onCompleteMobile = async (data: MobileCompleteForm) => {
    setError("");
    setLoading(true);
    try {
      await authApi.completeMobileRegistration({ ...data, mobile_number: mobileNumber });
      setSuccess("Registration complete! Redirecting to login...");
      setTimeout(() => navigate("/customer/login"), 2000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Customer Registration" subtitle="Create your VeriTrust account">
        <div className="mb-6 flex rounded border border-gray-200 bg-white p-1" role="tablist">
          {(["mobile", "email"] as Tab[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => { setTab(t); setError(""); setSuccess(""); }}
              className={`flex-1 rounded py-2.5 text-sm font-semibold transition ${
                tab === t
                  ? "bg-canara-blue text-white shadow-sm"
                  : "text-gray-600 hover:bg-canara-cream hover:text-canara-blue"
              }`}
            >
              {t === "mobile" ? "Register via Mobile OTP" : "Register via Email"}
            </button>
          ))}
        </div>

        {error && <div className="mb-4"><Alert type="error" message={error} /></div>}
        {success && <div className="mb-4"><Alert type="success" message={success} /></div>}

        {tab === "email" && emailStep === "register" && (
          <form onSubmit={emailForm.handleSubmit(onEmailRegister)} className="space-y-4">
            <div>
              <label htmlFor="full_name" className="form-label">Full Name</label>
              <input id="full_name" className="input-field" {...emailForm.register("full_name")} />
              {emailForm.formState.errors.full_name && (
                <p className="form-error">{emailForm.formState.errors.full_name.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="email" className="form-label">Email Address</label>
              <input id="email" type="email" className="input-field" {...emailForm.register("email")} />
              {emailForm.formState.errors.email && (
                <p className="form-error">{emailForm.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="form-label">Password</label>
              <input id="password" type="password" className="input-field" {...emailForm.register("password")} />
              {emailForm.formState.errors.password && (
                <p className="form-error">{emailForm.formState.errors.password.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="confirm_password" className="form-label">Confirm Password</label>
              <input id="confirm_password" type="password" className="input-field" {...emailForm.register("confirm_password")} />
              {emailForm.formState.errors.confirm_password && (
                <p className="form-error">{emailForm.formState.errors.confirm_password.message}</p>
              )}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Registering..." : "Register & Send OTP"}
            </button>
          </form>
        )}

        {tab === "email" && emailStep === "otp" && (
          <form onSubmit={emailOtpForm.handleSubmit(onEmailVerify)} className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter the OTP sent to <strong>{registeredEmail}</strong>
            </p>
            <OTPInput
              value={emailOtpForm.watch("otp_code") || ""}
              onChange={(v) => emailOtpForm.setValue("otp_code", v)}
              disabled={loading}
            />
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Verifying..." : "Verify OTP & Activate Account"}
            </button>
          </form>
        )}

        {tab === "mobile" && mobileStep === "number" && (
          <form onSubmit={mobileForm.handleSubmit(onSendMobileOTP)} className="space-y-4">
            <div>
              <label htmlFor="mobile_number" className="form-label">Mobile Number</label>
              <input
                id="mobile_number"
                type="tel"
                placeholder="10-digit mobile number"
                className="input-field"
                {...mobileForm.register("mobile_number")}
              />
              {mobileForm.formState.errors.mobile_number && (
                <p className="form-error">{mobileForm.formState.errors.mobile_number.message}</p>
              )}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {tab === "mobile" && mobileStep === "otp" && (
          <form onSubmit={mobileOtpForm.handleSubmit(onVerifyMobileOTP)} className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter OTP sent to <strong>+91 {mobileNumber}</strong>
            </p>
            <OTPInput
              value={mobileOtpForm.watch("otp_code") || ""}
              onChange={(v) => mobileOtpForm.setValue("otp_code", v)}
              disabled={loading}
            />
            <ResendTimer
              seconds={otpExpiresIn}
              disabled={loading}
              onResend={() => mobileForm.handleSubmit(onSendMobileOTP)()}
            />
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}

        {tab === "mobile" && mobileStep === "details" && (
          <form onSubmit={mobileCompleteForm.handleSubmit(onCompleteMobile)} className="space-y-4">
            <div>
              <label htmlFor="full_name_m" className="form-label">Full Name</label>
              <input id="full_name_m" className="input-field" {...mobileCompleteForm.register("full_name")} />
              {mobileCompleteForm.formState.errors.full_name && (
                <p className="form-error">{mobileCompleteForm.formState.errors.full_name.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="pan_number" className="form-label">PAN Number</label>
              <input
                id="pan_number"
                placeholder="ABCDE1234F"
                className="input-field uppercase"
                {...mobileCompleteForm.register("pan_number")}
              />
              {mobileCompleteForm.formState.errors.pan_number && (
                <p className="form-error">{mobileCompleteForm.formState.errors.pan_number.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="email_m" className="form-label">Email Address</label>
              <input id="email_m" type="email" className="input-field" {...mobileCompleteForm.register("email")} />
              {mobileCompleteForm.formState.errors.email && (
                <p className="form-error">{mobileCompleteForm.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password_m" className="form-label">Create Password</label>
              <input id="password_m" type="password" className="input-field" {...mobileCompleteForm.register("password")} />
              {mobileCompleteForm.formState.errors.password && (
                <p className="form-error">{mobileCompleteForm.formState.errors.password.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="confirm_password_m" className="form-label">Confirm Password</label>
              <input id="confirm_password_m" type="password" className="input-field" {...mobileCompleteForm.register("confirm_password")} />
              {mobileCompleteForm.formState.errors.confirm_password && (
                <p className="form-error">{mobileCompleteForm.formState.errors.confirm_password.message}</p>
              )}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Creating Account..." : "Complete Registration"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/customer/login" className="font-medium text-canara-blue hover:underline">
            Login here
          </Link>
        </p>
    </AuthLayout>
  );
}
