import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/DashboardLayout";

const roleLabels: Record<string, string> = {
  ADMIN: "Administrator",
  FRAUD_ANALYST: "Fraud Analyst",
  LOAN_OFFICER: "Loan Officer",
};

export default function EmployeeDashboard() {
  const { role, logout } = useAuth();

  return (
    <DashboardLayout
      title="Staff Dashboard"
      subtitle={roleLabels[role || ""] || role || ""}
      onLogout={logout}
    >
      <div className="mb-8 border-b-4 border-canara-gold pb-4">
        <h1 className="text-2xl font-bold text-canara-blue">
          VeriTrust Operations Center
        </h1>
        <p className="mt-1 text-gray-600">
          Document fraud detection and case management
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Pending Cases",
            value: "24",
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            title: "Verified Today",
            value: "156",
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            title: "Fraud Detected",
            value: "7",
            color: "text-red-600",
            bg: "bg-red-50",
          },
          {
            title: "Active Analysts",
            value: "12",
            color: "text-canara-blue",
            bg: "bg-blue-50",
          },
        ].map((stat) => (
          <div
            key={stat.title}
            className={`rounded-lg border border-gray-100 ${stat.bg} p-6 shadow-card`}
          >
            <p className="text-sm font-medium text-gray-500">{stat.title}</p>
            <p className={`mt-2 text-3xl font-bold ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-card">
          <h2 className="border-b border-gray-100 pb-3 font-bold text-canara-blue">
            Recent Activity
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-gray-600">
            <li className="flex items-center justify-between border-b border-gray-50 pb-3">
              <span>Document #VT-0892 flagged</span>
              <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                High Risk
              </span>
            </li>
            <li className="flex items-center justify-between border-b border-gray-50 pb-3">
              <span>Case #VT-0891 verified</span>
              <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-600">
                Clear
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>New submission received</span>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                Pending
              </span>
            </li>
          </ul>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-card">
          <h2 className="border-b border-gray-100 pb-3 font-bold text-canara-blue">
            Quick Actions
          </h2>
          <div className="mt-4 grid gap-3">
            {["Review Pending Cases", "Generate Report", "Manage Users"].map(
              (action) => (
                <button
                  key={action}
                  className="rounded border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700 transition hover:border-canara-blue hover:bg-canara-cream"
                >
                  {action}
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-1 text-sm font-medium text-canara-blue hover:underline"
      >
        ← Back to Home
      </Link>
    </DashboardLayout>
  );
}
