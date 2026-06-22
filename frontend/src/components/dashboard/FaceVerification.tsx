import { useState } from "react";

const verificationHistory = [
  { time: "Today 10:23 AM", method: "Liveness Detection", score: "98%", status: "Verified", device: "MacBook Air" },
  { time: "Yesterday 9:05 AM", method: "Liveness Detection", score: "97%", status: "Verified", device: "MacBook Air" },
  { time: "21 Jun 10:15 AM", method: "Liveness Detection", score: "96%", status: "Verified", device: "Windows Laptop" },
  { time: "20 Jun 9:45 AM", method: "Liveness Detection", score: "94%", status: "Verified", device: "MacBook Air" },
  { time: "19 Jun 10:30 AM", method: "Liveness Detection", score: "43%", status: "Failed", device: "Unknown Device" },
];

export default function FaceVerification() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const startScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress((p) => {
        if (p >= 100) { clearInterval(interval); setIsScanning(false); return 100; }
        return p + 4;
      });
    }, 120);
  };

  return (
    <div>
      <h2 className="section-heading">Face Liveness Verification</h2>

      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        {/* Camera Preview Panel */}
        <div className="dash-card lg:col-span-2">
          <div className="dash-card-header">
            <h3 className="font-bold text-canara-blue">Camera Verification</h3>
            <span className="badge-verified">Last verified: 10:23 AM</span>
          </div>

          {/* Camera Placeholder */}
          <div className="relative rounded-xl bg-gradient-to-br from-canara-blue-dark to-canara-blue overflow-hidden" style={{ aspectRatio: "16/9" }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              {isScanning ? (
                <>
                  <div className="relative mb-4">
                    <div className="h-32 w-32 rounded-full border-4 border-canara-gold border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-canara-gold font-bold text-lg">{scanProgress}%</span>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-blue-100 animate-pulse">Analyzing facial features…</p>
                  <p className="text-xs text-blue-300 mt-1">Please look directly at the camera</p>
                </>
              ) : scanProgress === 100 ? (
                <>
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 border-2 border-green-400">
                    <svg className="h-10 w-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg font-bold text-green-400">Identity Verified</p>
                  <p className="text-sm text-blue-200 mt-1">Confidence Score: 98%</p>
                </>
              ) : (
                <>
                  {/* Face outline placeholder */}
                  <div className="relative mb-4 flex h-32 w-28 items-center justify-center">
                    <div className="h-28 w-24 rounded-[50%] border-2 border-dashed border-canara-gold/60 flex items-center justify-center">
                      <svg className="h-16 w-16 text-white/30" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                      </svg>
                    </div>
                    {/* Corner markers */}
                    {[["top-0 left-0","rounded-tl"], ["top-0 right-0","rounded-tr"], ["bottom-0 left-0","rounded-bl"], ["bottom-0 right-0","rounded-br"]].map(([pos, r]) => (
                      <div key={pos} className={`absolute ${pos} h-4 w-4 border-2 border-canara-gold ${r}`}></div>
                    ))}
                  </div>
                  <p className="text-sm font-semibold text-blue-200">Camera Ready</p>
                  <p className="text-xs text-blue-300 mt-1">Position your face within the frame</p>
                </>
              )}
            </div>

            {/* Progress bar */}
            {isScanning && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-900">
                <div className="h-full bg-canara-gold transition-all" style={{ width: `${scanProgress}%` }}></div>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-3">
            <button className="btn-primary flex-1" onClick={startScan} disabled={isScanning}>
              {isScanning ? "Scanning…" : "Start Verification"}
            </button>
            <button className="btn-secondary flex-1" onClick={startScan} disabled={isScanning}>
              Reverify Identity
            </button>
          </div>
        </div>

        {/* Status Panel */}
        <div className="flex flex-col gap-4">
          <div className="dash-card">
            <h3 className="font-semibold text-canara-blue mb-3">Verification Status</h3>
            <div className="flex flex-col items-center py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-3">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="badge-verified text-base px-4 py-1.5">Verified</span>
              <p className="mt-3 text-center text-sm text-gray-600">Face identity confirmed and matched</p>
            </div>
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Confidence</span>
                <span className="font-bold text-green-600">98%</span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill bg-green-500" style={{ width: "98%" }}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>Last check</span>
                <span>10:23 AM</span>
              </div>
            </div>
          </div>

          <div className="dash-card">
            <h3 className="font-semibold text-canara-blue mb-3">Verification Stats</h3>
            {[
              { label: "Total Verifications", value: "128" },
              { label: "Success Rate", value: "99.2%" },
              { label: "Avg Confidence", value: "97.1%" },
              { label: "Last Failed", value: "19 Jun" },
            ].map((s) => (
              <div key={s.label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-500">{s.label}</span>
                <span className="text-xs font-bold text-gray-800">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h3 className="font-bold text-canara-blue">Verification History</h3>
          <span className="text-xs text-gray-400">Last 5 verifications</span>
        </div>
        <div className="overflow-x-auto">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Method</th>
                <th>Confidence</th>
                <th>Device</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {verificationHistory.map((row, i) => (
                <tr key={i}>
                  <td className="text-xs">{row.time}</td>
                  <td>{row.method}</td>
                  <td>
                    <span className={`font-bold ${parseFloat(row.score) >= 80 ? "text-green-600" : "text-red-500"}`}>{row.score}</span>
                  </td>
                  <td>{row.device}</td>
                  <td>
                    <span className={row.status === "Verified" ? "badge-verified" : "badge-danger"}>{row.status}</span>
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
