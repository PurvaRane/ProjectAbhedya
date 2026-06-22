import { useState } from "react";

export default function ProfileSection() {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "John Doe",
    email: "john.doe@veritrust.in",
    mobile: "+91 98765 43210",
    department: "Retail Banking",
    branch: "Mumbai Main Branch",
    employeeId: "EMP001245",
    designation: "Branch Manager",
    joinDate: "15 March 2021",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <h2 className="section-heading">Employee Profile</h2>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Avatar & Identity */}
        <div className="dash-card flex flex-col items-center py-8 text-center">
          <div className="relative mb-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-canara-blue text-white text-3xl font-bold shadow-card">
              JD
            </div>
            <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-canara-gold text-canara-blue-dark shadow-sm hover:bg-canara-gold-dark transition">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>

          <h3 className="text-xl font-bold text-gray-800">{form.name}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{form.email}</p>
          <span className="badge-role mt-3">{form.designation}</span>

          <div className="mt-6 w-full border-t border-gray-100 pt-4 space-y-2 text-sm">
            {[
              { label: "Employee ID", value: form.employeeId },
              { label: "Department", value: form.department },
              { label: "Branch", value: form.branch },
              { label: "Joined", value: form.joinDate },
            ].map((s) => (
              <div key={s.label} className="flex justify-between">
                <span className="text-gray-500">{s.label}</span>
                <span className="font-semibold text-gray-800">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Form */}
        <div className="dash-card lg:col-span-2">
          <div className="dash-card-header">
            <h3 className="font-bold text-canara-blue">Profile Information</h3>
            <button
              className={editing ? "btn-sm-danger" : "btn-sm-primary"}
              onClick={() => setEditing(!editing)}
            >
              {editing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Full Name", field: "name", type: "text" },
              { label: "Employee ID", field: "employeeId", type: "text", readonly: true },
              { label: "Email Address", field: "email", type: "email" },
              { label: "Mobile Number", field: "mobile", type: "tel" },
              { label: "Department", field: "department", type: "text" },
              { label: "Branch", field: "branch", type: "text" },
            ].map((f) => (
              <div key={f.field}>
                <label className="form-label">{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.field as keyof typeof form]}
                  onChange={(e) => handleChange(f.field, e.target.value)}
                  disabled={!editing || f.readonly}
                  className={`input-field ${(!editing || f.readonly) ? "bg-canara-gray text-gray-500 cursor-not-allowed" : ""}`}
                />
              </div>
            ))}
          </div>

          {editing && (
            <div className="mt-4 flex gap-3">
              <button className="btn-primary" onClick={() => setEditing(false)}>Save Changes</button>
              <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          )}

          {/* Security Info */}
          <div className="mt-6 rounded-xl bg-canara-blue/5 border border-canara-blue/20 p-4">
            <p className="text-sm font-bold text-canara-blue mb-2">Security Information</p>
            <div className="grid gap-2 sm:grid-cols-2 text-sm">
              {[
                { label: "Last Login", value: "Today 10:22 AM" },
                { label: "MFA Status", value: "Enabled" },
                { label: "Password Changed", value: "15 Jun 2026" },
                { label: "Face Verified", value: "Today 10:23 AM" },
              ].map((s) => (
                <div key={s.label} className="flex justify-between border-b border-blue-100 py-1.5 last:border-0">
                  <span className="text-gray-500">{s.label}</span>
                  <span className="font-semibold text-gray-800">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
