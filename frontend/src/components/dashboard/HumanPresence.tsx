import { useState } from "react";

const methods = [
  {
    id: "webcam",
    label: "Webcam Verification",
    desc: "Real-time liveness check using webcam feed to confirm human presence.",
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    status: "Active",
  },
  {
    id: "session",
    label: "Active Session Check",
    desc: "Validates ongoing user activity patterns within the current session.",
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    status: "Active",
  },
  {
    id: "interaction",
    label: "User Interaction Validation",
    desc: "Detects natural human interactions like typing rhythm and mouse movement.",
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
      </svg>
    ),
    status: "Active",
  },
];

export default function HumanPresence() {
  const [activeMethod, setActiveMethod] = useState("webcam");
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);

  const runCheck = () => {
    setChecking(true);
    setChecked(false);
    setTimeout(() => { setChecking(false); setChecked(true); }, 2500);
  };

  return (
    <div>
      <h2 className="section-heading">Human Presence Attestation</h2>

      {/* Main Status Card */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <div className="dash-card lg:col-span-1 flex flex-col items-center justify-center py-8 text-center">
          <div className="relative mb-4">
            <div className={`flex h-24 w-24 items-center justify-center rounded-full border-4 ${
              checking ? "border-amber-400 bg-amber-50 animate-pulse" :
              "border-green-400 bg-green-50"
            }`}>
              {checking ? (
                <svg className="h-12 w-12 text-amber-500 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white text-xs font-bold">✓</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800">
            {checking ? "Checking…" : "Human Presence Verified"}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {checking ? "Running liveness checks" : "Real human session confirmed"}
          </p>
          <div className="mt-4 w-full space-y-2">
            {[
              { label: "Presence Status", value: "Verified", ok: true },
              { label: "Last Check", value: "2 minutes ago", ok: true },
              { label: "Method", value: "Multi-factor", ok: true },
              { label: "Session Valid", value: "Yes", ok: true },
            ].map((s) => (
              <div key={s.label} className="flex justify-between text-sm border-b border-gray-50 py-1.5 last:border-0">
                <span className="text-gray-500">{s.label}</span>
                <span className={`font-semibold ${s.ok ? "text-green-600" : "text-red-500"}`}>{s.value}</span>
              </div>
            ))}
          </div>
          <button className="btn-primary mt-5 w-full" onClick={runCheck} disabled={checking}>
            {checking ? "Verifying…" : "Run Presence Check"}
          </button>
          {checked && (
            <div className="mt-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700 font-semibold w-full">
              ✅ Human presence confirmed just now
            </div>
          )}
        </div>

        {/* Verification Methods */}
        <div className="dash-card lg:col-span-2">
          <div className="dash-card-header">
            <h3 className="font-bold text-canara-blue">Verification Methods</h3>
            <span className="badge-verified">3 Methods Active</span>
          </div>
          <div className="grid gap-4">
            {methods.map((method) => (
              <div
                key={method.id}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  activeMethod === method.id
                    ? "border-canara-blue bg-blue-50"
                    : "border-gray-100 bg-canara-gray hover:border-gray-200"
                }`}
                onClick={() => setActiveMethod(method.id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`rounded-lg p-2 ${activeMethod === method.id ? "bg-canara-blue text-white" : "bg-white text-canara-blue border border-gray-200"}`}>
                    {method.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-gray-800">{method.label}</p>
                      <span className="badge-verified">{method.status}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{method.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-canara-blue/5 border border-canara-blue/20 p-4">
            <p className="text-sm font-semibold text-canara-blue mb-1">About Human Presence Attestation</p>
            <p className="text-xs text-gray-600">
              This system continuously monitors that the authenticated session is operated by a real human, not an automated bot or script. 
              Multiple passive signals are analyzed in real-time throughout your session.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Checks Table */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h3 className="font-bold text-canara-blue">Recent Presence Checks</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Method</th>
                <th>Confidence</th>
                <th>Session Duration</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {[
                { time: "Today 10:25 AM", method: "Webcam + Interaction", conf: "99%", duration: "3m 15s", result: "Human" },
                { time: "Today 10:22 AM", method: "Session Check", conf: "97%", duration: "0m 45s", result: "Human" },
                { time: "Yesterday 4:15 PM", method: "Multi-factor", conf: "98%", duration: "5m 20s", result: "Human" },
                { time: "19 Jun 11:45 PM", method: "Webcam", conf: "21%", duration: "0m 10s", result: "Bot Suspected" },
              ].map((row, i) => (
                <tr key={i}>
                  <td className="text-xs">{row.time}</td>
                  <td>{row.method}</td>
                  <td><span className={`font-bold ${parseFloat(row.conf) > 80 ? "text-green-600" : "text-red-500"}`}>{row.conf}</span></td>
                  <td className="text-xs">{row.duration}</td>
                  <td>
                    <span className={row.result === "Human" ? "badge-verified" : "badge-danger"}>{row.result}</span>
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
