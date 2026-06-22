import { useState } from "react";

const initialDevices = [
  {
    id: "DEV-001",
    name: "MacBook Air M2",
    os: "macOS 14.2",
    browser: "Chrome 124",
    fingerprint: "a3f9b2c1d8e7",
    lastLogin: "Today 10:22 AM",
    status: "Trusted",
    current: true,
    location: "Mumbai, IN",
  },
  {
    id: "DEV-002",
    name: "Windows Laptop (Dell XPS)",
    os: "Windows 11",
    browser: "Edge 124",
    fingerprint: "b7d2a1c9e4f5",
    lastLogin: "Yesterday 4:15 PM",
    status: "Trusted",
    current: false,
    location: "Head Office, Mumbai",
  },
  {
    id: "DEV-003",
    name: "iPhone 15 Pro",
    os: "iOS 17.4",
    browser: "Safari 17",
    fingerprint: "c1e8d3b6f2a9",
    lastLogin: "18 Jun 8:30 AM",
    status: "Trusted",
    current: false,
    location: "Mumbai, IN",
  },
  {
    id: "DEV-004",
    name: "Unknown Device",
    os: "Windows 10",
    browser: "Firefox 125",
    fingerprint: "d4f1a7b2c8e3",
    lastLogin: "19 Jun 11:45 PM",
    status: "Pending",
    current: false,
    location: "Pune, IN",
  },
];

export default function DeviceVerification() {
  const [devices, setDevices] = useState(initialDevices);

  const trustDevice = (id: string) => {
    setDevices((prev) => prev.map((d) => d.id === id ? { ...d, status: "Trusted" } : d));
  };

  const removeDevice = (id: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== id));
  };

  const currentDevice = devices.find((d) => d.current);

  return (
    <div>
      <h2 className="section-heading">Device Trust Verification</h2>

      {/* Current Device Card */}
      {currentDevice && (
        <div className="mb-6 rounded-xl border-2 border-canara-blue bg-gradient-to-r from-canara-blue/5 to-blue-50 p-5 shadow-card">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-canara-blue text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-canara-blue">{currentDevice.name}</p>
                <p className="text-xs text-gray-500">{currentDevice.os} · {currentDevice.browser}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="badge-info">Current Device</span>
              <span className="badge-verified">Trusted</span>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Device Fingerprint", value: currentDevice.fingerprint, mono: true },
              { label: "Last Login", value: currentDevice.lastLogin, mono: false },
              { label: "Location", value: currentDevice.location, mono: false },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-white border border-blue-100 px-3 py-2">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">{item.label}</p>
                <p className={`text-sm font-semibold text-gray-800 ${item.mono ? "font-mono" : ""}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Devices Table */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h3 className="font-bold text-canara-blue">All Trusted Devices</h3>
          <div className="flex gap-2">
            <span className="badge-verified">{devices.filter(d => d.status === "Trusted").length} Trusted</span>
            {devices.some(d => d.status === "Pending") && (
              <span className="badge-warning">{devices.filter(d => d.status === "Pending").length} Pending</span>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Device</th>
                <th>OS / Browser</th>
                <th>Fingerprint</th>
                <th>Location</th>
                <th>Last Login</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      {d.current && <span className="h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0"></span>}
                      <span className="font-medium">{d.name}</span>
                    </div>
                  </td>
                  <td className="text-xs text-gray-500">{d.os} · {d.browser}</td>
                  <td className="font-mono text-xs text-gray-500">{d.fingerprint}</td>
                  <td className="text-xs">{d.location}</td>
                  <td className="text-xs">{d.lastLogin}</td>
                  <td>
                    <span className={
                      d.status === "Trusted" ? "badge-verified" :
                      d.status === "Pending" ? "badge-warning" : "badge-danger"
                    }>
                      {d.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      {d.status === "Pending" && (
                        <button className="btn-sm-primary" onClick={() => trustDevice(d.id)}>Trust</button>
                      )}
                      {!d.current && (
                        <button className="btn-sm-danger" onClick={() => removeDevice(d.id)}>Remove</button>
                      )}
                      {d.current && (
                        <span className="text-xs text-gray-400 italic">Active</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex gap-3">
          <button className="btn-primary">Trust This Device</button>
          <button className="btn-secondary">Review All Devices</button>
        </div>
      </div>
    </div>
  );
}
