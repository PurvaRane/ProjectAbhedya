import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthLayout from "../components/AuthLayout";
import Alert from "../components/Alert";
import { authApi, getErrorMessage } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { employeeLoginSchema, EmployeeLoginForm } from "../lib/validation";

export default function EmployeeLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<EmployeeLoginForm>({
    resolver: zodResolver(employeeLoginSchema),
  });

  const onSubmit = async (data: EmployeeLoginForm) => {
    setError("");
    setLoading(true);
    try {
      const res = await authApi.employeeLogin(data);
      login(res.data);
      navigate("/employee/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Staff Login" subtitle="Authorized personnel access only">
        <div className="mb-6 rounded bg-canara-cream p-4 text-sm text-canara-blue-dark">
          <strong>Secure Access:</strong> This portal is restricted to pre-authorized bank employees.
          Self-registration is not available.
        </div>

        {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Authenticating..." : "Sign In to Dashboard"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          <Link to="/" className="font-medium text-canara-blue hover:underline">
            Back to Home
          </Link>
        </p>
    </AuthLayout>
  );
}
