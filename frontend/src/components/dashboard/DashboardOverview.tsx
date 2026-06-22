import { useState } from "react";

const securityCards = [
  {
    id: "auth",
    title: "Authentication Status",
    status: "Active",
    badge: "badge-verified",
    dot: "bg-green-500",
    lastUpdated: "Just now",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    section: "auth",
    iconBg: "bg-blue-50 text-canara-blue",
  },
  {
    id: "mfa",
    title: "MFA Status",
    status: "Enabled",
    badge: "badge-verified",
    dot: "bg-green-500",
    lastUpdated: "2 min ago",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    section: "mfa",
    iconBg: "bg-green-50 text-green-600",
  },
  {
    id: "face",
    title: "Face Verification",
    status: "Verified",
    badge: "badge-verified",
    dot: "bg-green-500",
    lastUpdated: "5 min ago",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    section: "face",
    iconBg: "bg-purple-50 text-purple-600",
  },
  {
    id: "device",
    title: "Trusted Device",
    status: "Trusted",
    badge: "badge-verified",
    dot: "bg-green-500",
    lastUpdated: "Today, 10:24",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    section: "device",
    iconBg: "bg-indigo-50 text-indigo-600",
  },
  {
    id: "human",
    title: "Human Presence",
    status: "Verified",
    badge: "badge-verified",
    dot: "bg-green-500",
    lastUpdated: "2 min ago",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    section: "human",
    iconBg: "bg-teal-50 text-teal-600",
  },
  {
    id: "bcs",
    title: "Behavioral Score",
    status: "92% — High",
    badge: "badge-verified",
    dot: "bg-green-500",
    lastUpdated: "Real-time",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    section: "bcs",
    iconBg: "bg-amber-50 text-amber-600",
  },
  {
    id: "rbac",
    title: "Access Role",
    status: "Branch Manager",
    badge: "badge-info",
    dot: "bg-blue-500",
    lastUpdated: "Session start",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
    section: "rbac",
    iconBg: "bg-orange-50 text-orange-600",
  },
  {
    id: "login",
    title: "Recent Login",
    status: "Today, 10:22 AM",
    badge: "badge-verified",
    dot: "bg-green-500",
    lastUpdated: "Mumbai Branch",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
      </svg>
    ),
    section: "audit",
    iconBg: "bg-gray-50 text-gray-600",
  },
];

const summaryStats = [
  { label: "Total Logins (30d)", value: "248", change: "+12%", up: true, color: "text-canara-blue", bg: "bg-blue-50" },
  { label: "Successful Auths", value: "246", change: "+11%", up: true, color: "text-green-600", bg: "bg-green-50" },
  { label: "Failed Attempts", value: "2", change: "-67%", up: false, color: "text-red-600", bg: "bg-red-50" },
  { label: "Active Sessions", value: "1", change: "Current", up: true, color: "text-indigo-600", bg: "bg-indigo-50" },
  { label: "Trusted Devices", value: "3", change: "+1 this month", up: true, color: "text-amber-600", bg: "bg-amber-50" },
  { label: "Face Verify Rate", value: "98.4%", change: "+0.4%", up: true, color: "text-purple-600", bg: "bg-purple-50" },
];

interface Props {
  onNavigate: (section: string) => void;
}

export default function DashboardOverview({ onNavigate }: Props) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div>
      {/* Welcome Banner */}
      <div className="mb-6 rounded-xl bg-gradient-to-r from-canara-blue to-canara-blue-light p-6 text-white shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-sm font-medium">Monday, 22 June 2026 — Session Active</p>
            <h1 className="mt-1 text-2xl font-bold">Security Overview</h1>
            <p className="mt-1 text-blue-100 text-sm">All systems operational. Your session is secure and monitored.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-sm font-semibold">Secure Session</span>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <h2 className="section-heading">Security Summary</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
        {summaryStats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className={`mb-3 inline-flex items-center justify-center rounded-lg ${stat.bg} p-2`}>
              <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
            </div>
            <p className="text-xs font-semibold text-gray-500 leading-snug">{stat.label}</p>
            <p className={`mt-1 text-xs font-medium ${stat.up ? "text-green-600" : "text-red-500"}`}>{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Security Status Cards */}
      <h2 className="section-heading">Security Status</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {securityCards.map((card) => (
          <div
            key={card.id}
            className={`dash-card cursor-pointer group ${hoveredCard === card.id ? "ring-2 ring-canara-blue" : ""}`}
            onMouseEnter={() => setHoveredCard(card.id)}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => onNavigate(card.section)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`rounded-lg p-2 ${card.iconBg}`}>
                {card.icon}
              </div>
              <span className={`relative flex h-2.5 w-2.5 mt-1`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${card.dot} opacity-50`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${card.dot}`}></span>
              </span>
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{card.title}</p>
            <p className="font-bold text-gray-800 text-sm mb-2">{card.status}</p>
            <p className="text-xs text-gray-400">
              <span className="font-medium">Last updated:</span> {card.lastUpdated}
            </p>
            <button
              className="mt-3 btn-sm-secondary w-full justify-center group-hover:bg-canara-blue group-hover:text-white group-hover:border-canara-blue transition-all"
              onClick={(e) => { e.stopPropagation(); onNavigate(card.section); }}
            >
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="dash-card">
          <div className="dash-card-header">
            <h3 className="font-bold text-canara-blue">Recent Authentication Events</h3>
            <button className="btn-sm-secondary" onClick={() => onNavigate("audit")}>View All</button>
          </div>
          <div className="space-y-3">
            {[
              { event: "Login Success", time: "Today 10:25 AM", status: "badge-verified", label: "Success" },
              { event: "OTP Verification", time: "Today 10:24 AM", status: "badge-verified", label: "Success" },
              { event: "Face Verification", time: "Today 10:23 AM", status: "badge-verified", label: "Verified" },
              { event: "Password Check", time: "Today 10:22 AM", status: "badge-verified", label: "Passed" },
              { event: "Failed Login Attempt", time: "Yesterday 11:45 PM", status: "badge-danger", label: "Blocked" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.event}</p>
                  <p className="text-xs text-gray-400">{item.time}</p>
                </div>
                <span className={item.status}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <h3 className="font-bold text-canara-blue">Quick Actions</h3>
          </div>
          <div className="grid gap-3">
            {[
              { label: "Change Password", section: "auth", icon: "🔑" },
              { label: "Verify OTP", section: "mfa", icon: "📱" },
              { label: "Run Face Verification", section: "face", icon: "📸" },
              { label: "Review Trusted Devices", section: "device", icon: "💻" },
              { label: "View Audit Logs", section: "audit", icon: "📋" },
              { label: "Check Access Permissions", section: "rbac", icon: "🔐" },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => onNavigate(action.section)}
                className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700 transition hover:border-canara-blue hover:bg-canara-cream hover:text-canara-blue"
              >
                <span className="text-base">{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
