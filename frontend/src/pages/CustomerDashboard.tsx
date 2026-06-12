import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/DashboardLayout";

export default function CustomerDashboard() {
  const { role, logout } = useAuth();

  return (
    <DashboardLayout
      title="Customer Dashboard"
      subtitle={`Role: ${role}`}
      onLogout={logout}
    >
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-card">
        <div className="border-b-4 border-canara-gold pb-4">
          <h1 className="text-2xl font-bold text-canara-blue">
            Welcome to VeriTrust
          </h1>
          <p className="mt-1 text-gray-600">
            Your secure customer banking portal
          </p>
        </div>

        <p className="mt-6 text-gray-600">
          Your account is authenticated. Document verification services are
          available below.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Upload Documents",
              desc: "Submit documents for AI verification",
            },
            {
              title: "Verification Status",
              desc: "Track your application progress",
            },
            { title: "Fraud Alerts", desc: "View security notifications" },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-gray-100 bg-canara-cream p-5 transition hover:border-canara-gold"
            >
              <div className="mb-3 h-1 w-10 bg-canara-gold" />
              <p className="font-semibold text-canara-blue">{item.title}</p>
              <p className="mt-1 text-sm text-gray-500">{item.desc}</p>
              <p className="mt-2 text-xs font-medium text-canara-blue-light">
                Coming Soon
              </p>
            </div>
          ))}
        </div>

        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-1 text-sm font-medium text-canara-blue hover:underline"
        >
          ← Back to Home
        </Link>
      </div>
    </DashboardLayout>
  );
}
