import { useState } from "react";

const rolePermissions = [
  { permission: "View Account Details", allowed: true, category: "Accounts" },
  { permission: "Create New Accounts", allowed: true, category: "Accounts" },
  { permission: "Modify Account Info", allowed: true, category: "Accounts" },
  { permission: "Delete Accounts", allowed: false, category: "Accounts" },
  { permission: "View Transactions", allowed: true, category: "Transactions" },
  { permission: "Initiate Transfers", allowed: true, category: "Transactions" },
  { permission: "Approve Large Transfers", allowed: false, category: "Transactions" },
  { permission: "Approve Loans", allowed: true, category: "Loans" },
  { permission: "Reject Loans", allowed: true, category: "Loans" },
  { permission: "Disburse Loan Funds", allowed: false, category: "Loans" },
  { permission: "View Audit Logs", allowed: true, category: "Administration" },
  { permission: "Manage Staff Users", allowed: false, category: "Administration" },
  { permission: "Export Reports", allowed: true, category: "Administration" },
  { permission: "System Configuration", allowed: false, category: "Administration" },
];

const categories = ["All", "Accounts", "Transactions", "Loans", "Administration"];

export default function AccessControl() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filtered = selectedCategory === "All"
    ? rolePermissions
    : rolePermissions.filter((p) => p.category === selectedCategory);

  const allowedCount = filtered.filter((p) => p.allowed).length;
  const restrictedCount = filtered.filter((p) => !p.allowed).length;

  return (
    <div>
      <h2 className="section-heading">Role-Based Access Control</h2>

      {/* Role Card */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <div className="dash-card flex flex-col items-center justify-center py-10 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-canara-blue mb-4">
            <svg className="h-10 w-10 text-canara-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">Current Role</p>
          <span className="badge-role text-base">Branch Manager</span>
          <p className="mt-4 text-sm text-gray-500">Mumbai Main Branch</p>

          <div className="mt-6 w-full space-y-2 border-t border-gray-100 pt-4">
            {[
              { label: "Employee ID", value: "EMP001245" },
              { label: "Department", value: "Retail Banking" },
              { label: "Role Assigned", value: "01 Jan 2025" },
              { label: "Next Review", value: "01 Jan 2027" },
            ].map((s) => (
              <div key={s.label} className="flex justify-between text-sm">
                <span className="text-gray-500">{s.label}</span>
                <span className="font-semibold text-gray-800">{s.value}</span>
              </div>
            ))}
          </div>

          <button className="btn-secondary mt-5 w-full">Request Additional Access</button>
        </div>

        {/* Summary */}
        <div className="dash-card lg:col-span-2">
          <div className="dash-card-header">
            <h3 className="font-bold text-canara-blue">Access Summary</h3>
            <span className="badge-info">Branch Manager Role</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            {[
              { label: "Total Permissions", value: rolePermissions.length, color: "text-canara-blue", bg: "bg-blue-50" },
              { label: "Allowed", value: rolePermissions.filter(p => p.allowed).length, color: "text-green-600", bg: "bg-green-50" },
              { label: "Restricted", value: rolePermissions.filter(p => !p.allowed).length, color: "text-red-600", bg: "bg-red-50" },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl ${s.bg} p-4 text-center`}>
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1 font-semibold">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Other Roles Context */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Role Hierarchy</p>
            <div className="space-y-2">
              {[
                { role: "Administrator", level: 1, access: "Full System Access" },
                { role: "Branch Manager", level: 2, access: "Branch Operations + Loan Approval", current: true },
                { role: "Loan Officer", level: 3, access: "Loan Processing Only" },
                { role: "Fraud Analyst", level: 4, access: "Read-only + Flagging" },
              ].map((r) => (
                <div key={r.role} className={`flex items-center gap-3 rounded-lg px-4 py-2.5 ${r.current ? "bg-canara-blue/10 border border-canara-blue/20" : "bg-canara-gray"}`}>
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${r.current ? "bg-canara-blue text-white" : "bg-gray-200 text-gray-500"}`}>{r.level}</div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${r.current ? "text-canara-blue" : "text-gray-700"}`}>{r.role} {r.current && <span className="ml-1 text-xs font-normal text-canara-blue/70">(You)</span>}</p>
                    <p className="text-xs text-gray-400">{r.access}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Permissions Table */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h3 className="font-bold text-canara-blue">Permissions Grid</h3>
          <div className="flex gap-2">
            <span className="badge-verified">{allowedCount} Allowed</span>
            <span className="badge-danger">{restrictedCount} Restricted</span>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                selectedCategory === cat
                  ? "bg-canara-blue text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Permission</th>
                <th>Category</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={i}>
                  <td className="font-medium">{p.permission}</td>
                  <td><span className="badge-info">{p.category}</span></td>
                  <td>
                    {p.allowed ? (
                      <span className="badge-verified">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        Allowed
                      </span>
                    ) : (
                      <span className="badge-danger">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Restricted
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
