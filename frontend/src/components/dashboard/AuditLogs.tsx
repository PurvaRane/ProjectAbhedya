import { useState } from "react";

type LogEntry = {
  id: string;
  timestamp: string;
  event: string;
  category: string;
  ip: string;
  device: string;
  location: string;
  status: "Success" | "Failed" | "Blocked" | "Warning";
};

const allLogs: LogEntry[] = [
  { id: "L001", timestamp: "Today 10:25 AM", event: "Employee Login", category: "Login", ip: "192.168.1.45", device: "MacBook Air M2", location: "Mumbai Branch", status: "Success" },
  { id: "L002", timestamp: "Today 10:24 AM", event: "OTP Verification", category: "MFA", ip: "192.168.1.45", device: "MacBook Air M2", location: "Mumbai Branch", status: "Success" },
  { id: "L003", timestamp: "Today 10:23 AM", event: "Face Liveness Check", category: "Face", ip: "192.168.1.45", device: "MacBook Air M2", location: "Mumbai Branch", status: "Success" },
  { id: "L004", timestamp: "Today 10:22 AM", event: "Password Authentication", category: "Login", ip: "192.168.1.45", device: "MacBook Air M2", location: "Mumbai Branch", status: "Success" },
  { id: "L005", timestamp: "Yesterday 11:45 PM", event: "Login Attempt", category: "Login", ip: "203.0.113.55", device: "Unknown Device", location: "Pune, IN", status: "Blocked" },
  { id: "L006", timestamp: "Yesterday 4:15 PM", event: "Employee Login", category: "Login", ip: "10.0.0.23", device: "Windows Laptop", location: "Head Office", status: "Success" },
  { id: "L007", timestamp: "Yesterday 4:14 PM", event: "OTP Verification", category: "MFA", ip: "10.0.0.23", device: "Windows Laptop", location: "Head Office", status: "Success" },
  { id: "L008", timestamp: "Yesterday 4:13 PM", event: "Face Verification", category: "Face", ip: "10.0.0.23", device: "Windows Laptop", location: "Head Office", status: "Success" },
  { id: "L009", timestamp: "21 Jun 10:15 AM", event: "OTP Expired", category: "MFA", ip: "192.168.1.45", device: "MacBook Air M2", location: "Mumbai Branch", status: "Warning" },
  { id: "L010", timestamp: "21 Jun 10:14 AM", event: "Employee Login", category: "Login", ip: "192.168.1.45", device: "MacBook Air M2", location: "Mumbai Branch", status: "Success" },
  { id: "L011", timestamp: "19 Jun 11:45 PM", event: "Face Verification Failed", category: "Face", ip: "203.0.113.55", device: "Unknown Device", location: "Pune, IN", status: "Failed" },
  { id: "L012", timestamp: "19 Jun 11:44 PM", event: "Login Attempt", category: "Login", ip: "203.0.113.55", device: "Unknown Device", location: "Pune, IN", status: "Failed" },
];

const categories = ["All", "Login", "MFA", "Face"];
const statusOptions = ["All", "Success", "Failed", "Blocked", "Warning"];

const statusBadge = (s: string) => {
  if (s === "Success") return "badge-verified";
  if (s === "Failed") return "badge-danger";
  if (s === "Blocked") return "badge-danger";
  if (s === "Warning") return "badge-warning";
  return "badge-info";
};

export default function AuditLogs() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const perPage = 8;

  const filtered = allLogs.filter((log) => {
    const matchSearch = search === "" || log.event.toLowerCase().includes(search.toLowerCase()) || log.ip.includes(search) || log.device.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || log.category === category;
    const matchStatus = statusFilter === "All" || log.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div>
      <h2 className="section-heading">Authentication Audit Logs</h2>

      {/* Summary Badges */}
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        {[
          { label: "Total Events", value: allLogs.length, badge: "badge-info" },
          { label: "Successful", value: allLogs.filter(l => l.status === "Success").length, badge: "badge-verified" },
          { label: "Failed / Blocked", value: allLogs.filter(l => l.status === "Failed" || l.status === "Blocked").length, badge: "badge-danger" },
          { label: "Warnings", value: allLogs.filter(l => l.status === "Warning").length, badge: "badge-warning" },
        ].map((s) => (
          <div key={s.label} className="stat-card flex items-center gap-4">
            <span className={`text-3xl font-bold ${s.badge === "badge-verified" ? "text-green-600" : s.badge === "badge-danger" ? "text-red-600" : s.badge === "badge-warning" ? "text-amber-600" : "text-blue-600"}`}>{s.value}</span>
            <div>
              <p className="text-xs text-gray-500 font-semibold">{s.label}</p>
              <span className={`mt-1 ${s.badge}`}>{s.badge === "badge-verified" ? "Good" : s.badge === "badge-danger" ? "Alert" : s.badge === "badge-warning" ? "Review" : "Info"}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-card">
        {/* Filter Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setPage(1); }}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${category === cat ? "bg-canara-blue text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {cat}
              </button>
            ))}
            <span className="text-gray-200">|</span>
            {statusOptions.map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${statusFilter === s ? "bg-canara-gold text-canara-blue-dark" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search logs…"
              className="input-sm w-48"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            <button className="btn-sm-secondary" title="Export logs">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Timestamp</th>
                <th>Event</th>
                <th>Category</th>
                <th>IP Address</th>
                <th>Device</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-gray-400 py-8">No logs match your filters</td>
                </tr>
              ) : paginated.map((log) => (
                <tr key={log.id}>
                  <td className="font-mono text-xs text-gray-400">{log.id}</td>
                  <td className="text-xs whitespace-nowrap">{log.timestamp}</td>
                  <td className="font-medium">{log.event}</td>
                  <td><span className="badge-info">{log.category}</span></td>
                  <td className="font-mono text-xs">{log.ip}</td>
                  <td className="text-xs">{log.device}</td>
                  <td className="text-xs">{log.location}</td>
                  <td><span className={statusBadge(log.status)}>{log.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-gray-500">Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length} logs</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-sm-secondary disabled:opacity-40"
              >← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`h-8 w-8 rounded text-xs font-bold ${page === i + 1 ? "bg-canara-blue text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-sm-secondary disabled:opacity-40"
              >Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
