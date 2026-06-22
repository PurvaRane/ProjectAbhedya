import { useState } from "react";

const sessions = [
  { id: "SES-001", ip: "192.168.1.45", device: "MacBook Air M2", location: "Mumbai Branch", time: "Today 10:22 AM", status: "Active" },
  { id: "SES-002", ip: "10.0.0.23", device: "Windows Laptop", location: "Head Office", time: "Yesterday 4:15 PM", status: "Expired" },
  { id: "SES-003", ip: "172.16.0.8", device: "MacBook Air M2", location: "Mumbai Branch", time: "22 Jun 9:01 AM", status: "Expired" },
];

export default function AuthenticationCenter() {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showSessions, setShowSessions] = useState(true);

  return (
    <div>
      <h2 className="section-heading">Authentication Center</h2>

      {/* Employee Auth Info */}
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <div className="dash-card lg:col-span-2">
          <div className="dash-card-header">
            <h3 className="font-bold text-canara-blue">Credential Information</h3>
            <span className="badge-verified">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
              Authenticated
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Employee ID", value: "EMP001245" },
              { label: "Username", value: "john.doe@veritrust.in" },
              { label: "Authentication Status", value: "Active — MFA Enabled" },
              { label: "Last Password Change", value: "15 June 2026" },
              { label: "Password Expiry", value: "15 September 2026" },
              { label: "Account Type", value: "Branch Manager" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-canara-gray px-4 py-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{item.label}</p>
                <p className="text-sm font-semibold text-gray-800">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-card flex flex-col gap-3">
          <div className="dash-card-header">
            <h3 className="font-bold text-canara-blue">Quick Actions</h3>
          </div>
          <button className="btn-primary w-full" onClick={() => setShowPasswordForm(!showPasswordForm)}>
            {showPasswordForm ? "Cancel" : "Change Password"}
          </button>
          <button className="btn-secondary w-full">Reset Password</button>
          <button className="btn-sm-secondary w-full justify-center py-2.5" onClick={() => setShowSessions(!showSessions)}>
            {showSessions ? "Hide" : "View"} Login Sessions
          </button>
          <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs font-semibold text-amber-700">⚠ Password expires in 84 days</p>
            <p className="text-xs text-amber-600 mt-0.5">Consider updating it soon for security</p>
          </div>
        </div>
      </div>

      {/* Change Password Form */}
      {showPasswordForm && (
        <div className="dash-card mb-6">
          <div className="dash-card-header">
            <h3 className="font-bold text-canara-blue">Change Password</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="form-label">Current Password</label>
              <input type="password" className="input-field" placeholder="Enter current password" />
            </div>
            <div>
              <label className="form-label">New Password</label>
              <input type="password" className="input-field" placeholder="Min 12 characters" />
            </div>
            <div>
              <label className="form-label">Confirm New Password</label>
              <input type="password" className="input-field" placeholder="Re-enter new password" />
            </div>
          </div>
          <div className="mt-3 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
            Password must be 12+ characters, include uppercase, lowercase, a number, and a special character.
          </div>
          <div className="mt-4 flex gap-3">
            <button className="btn-primary px-8">Update Password</button>
            <button className="btn-secondary px-8" onClick={() => setShowPasswordForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Active Sessions */}
      {showSessions && (
        <div className="dash-card">
          <div className="dash-card-header">
            <h3 className="font-bold text-canara-blue">Login Sessions</h3>
            <span className="text-xs text-gray-500">3 sessions found</span>
          </div>
          <div className="overflow-x-auto">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>IP Address</th>
                  <th>Device</th>
                  <th>Location</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td className="font-mono text-xs">{s.id}</td>
                    <td className="font-mono text-xs">{s.ip}</td>
                    <td>{s.device}</td>
                    <td>{s.location}</td>
                    <td className="text-xs">{s.time}</td>
                    <td>
                      <span className={s.status === "Active" ? "badge-verified" : "text-gray-400 text-xs"}>
                        {s.status}
                      </span>
                    </td>
                    <td>
                      {s.status === "Active" ? (
                        <button className="btn-sm-danger">Terminate</button>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
