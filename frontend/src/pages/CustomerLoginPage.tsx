import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthLayout from "../components/AuthLayout";
import Alert from "../components/Alert";
import { authApi, getErrorMessage } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { customerLoginSchema, CustomerLoginForm } from "../lib/validation";

export default function CustomerLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<CustomerLoginForm>({
    resolver: zodResolver(customerLoginSchema),
  });

  const onSubmit = async (data: CustomerLoginForm) => {
    setError("");
    setLoading(true);
    try {
      const res = await authApi.customerLogin(data);
      login(res.data);
      navigate("/customer/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Customer Login" subtitle="Access your VeriTrust account securely">
        {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          New customer?{" "}
          <Link to="/customer/register" className="font-medium text-canara-blue hover:underline">
            Register here
          </Link>
        </p>
    </AuthLayout>
  );
}
