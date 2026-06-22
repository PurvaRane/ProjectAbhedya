import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CanaraLogo from "../components/CanaraLogo";

import DashboardOverview from "../components/dashboard/DashboardOverview";
import AuthenticationCenter from "../components/dashboard/AuthenticationCenter";
import MFACenter from "../components/dashboard/MFACenter";
import FaceVerification from "../components/dashboard/FaceVerification";
import DeviceVerification from "../components/dashboard/DeviceVerification";
import HumanPresence from "../components/dashboard/HumanPresence";
import BehavioralScore from "../components/dashboard/BehavioralScore";
import AccessControl from "../components/dashboard/AccessControl";
import AuditLogs from "../components/dashboard/AuditLogs";
import ProfileSection from "../components/dashboard/ProfileSection";
import SettingsSection from "../components/dashboard/SettingsSection";

// ──────────────────────────────────────────────
// Sidebar Navigation Items
// ──────────────────────────────────────────────
type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  dividerBefore?: boolean;
};

const navItems: NavItem[] = [
  {
    id: "overview",
    label: "Dashboard Overview",
    icon: (
      <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: "auth",
    label: "Authentication Center",
    dividerBefore: true,
    icon: (
      <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    id: "mfa",
    label: "MFA Center",
    icon: (
      <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "face",
    label: "Face Verification",
    icon: (
      <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: "device",
    label: "Device Verification",
    icon: (
      <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "human",
    label: "Behavioral Monitoring",
    icon: (
      <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: "bcs",
    label: "Behavioral Score",
    icon: (
      <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: "rbac",
    label: "Access Control",
    dividerBefore: true,
    icon: (
      <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
  },
  {
    id: "audit",
    label: "Audit Logs",
    icon: (
      <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    id: "profile",
    label: "Profile",
    dividerBefore: true,
    icon: (
      <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const roleLabels: Record<string, string> = {
  ADMIN: "Administrator",
  FRAUD_ANALYST: "Fraud Analyst",
  LOAN_OFFICER: "Loan Officer",
  BRANCH_MANAGER: "Branch Manager",
};

// ──────────────────────────────────────────────
// Main Dashboard
// ──────────────────────────────────────────────
export default function EmployeeDashboard() {
  const { role, logout } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifCount] = useState(3);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/employee/login");
  };

  const renderSection = () => {
    switch (activeSection) {
      case "overview":   return <DashboardOverview onNavigate={setActiveSection} />;
      case "auth":       return <AuthenticationCenter />;
      case "mfa":        return <MFACenter />;
      case "face":       return <FaceVerification />;
      case "device":     return <DeviceVerification />;
      case "human":      return <HumanPresence />;
      case "bcs":        return <BehavioralScore />;
      case "rbac":       return <AccessControl />;
      case "audit":      return <AuditLogs />;
      case "profile":    return <ProfileSection />;
      case "settings":   return <SettingsSection />;
      default:           return <DashboardOverview onNavigate={setActiveSection} />;
    }
  };

  const currentNavLabel = navItems.find((n) => n.id === activeSection)?.label ?? "Dashboard";
  const displayRole = roleLabels[role || ""] || role || "Employee";

  return (
    <div className="dashboard-shell">
      {/* ── Top Security Banner ── */}
      <div className="canara-top-bar">
        <div className="mx-auto flex max-w-full items-center justify-between px-4 py-1.5">
          <span>🔒 Secure Session Active — Authorized Personnel Only</span>
          <span className="hidden sm:block">VeriTrust Digital Platform · Last login: Today 10:22 AM</span>
        </div>
      </div>

      {/* ── Top Navigation Bar ── */}
      <header className="dashboard-topbar">
        {/* Left: Toggle + Logo */}
        <div className="flex items-center gap-4">
          <button
            id="sidebar-toggle"
            onClick={() => setSidebarExpanded((v) => !v)}
            className="rounded-lg p-2 text-white hover:bg-white/10 transition"
            aria-label="Toggle sidebar"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <CanaraLogo variant="light" showTagline={false} />
        </div>

        {/* Center: Breadcrumb */}
        <div className="hidden lg:flex items-center gap-2 text-sm text-blue-200">
          <span>Employee Portal</span>
          <span className="text-canara-gold">›</span>
          <span className="text-white font-semibold">{currentNavLabel}</span>
        </div>

        {/* Right: Employee info + actions */}
        <div className="flex items-center gap-3">
          {/* Employee Info */}
          <div className="hidden md:block text-right mr-2">
            <p className="text-sm font-bold text-white leading-tight">John Doe</p>
            <p className="text-xs text-canara-gold leading-tight">EMP001245 · {displayRole}</p>
          </div>

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              id="notif-btn"
              onClick={() => setNotifOpen((v) => !v)}
              className="relative rounded-lg p-2 text-white hover:bg-white/10 transition"
              aria-label="Notifications"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notifCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {notifCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-gray-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <p className="font-bold text-canara-blue">Notifications</p>
                  <span className="badge-danger">{notifCount} new</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {[
                    { title: "Suspicious login attempt blocked", time: "Yesterday 11:45 PM", type: "danger" },
                    { title: "OTP expired without verification", time: "21 Jun 10:14 AM", type: "warning" },
                    { title: "Password expires in 84 days", time: "System Alert", type: "info" },
                  ].map((n, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-canara-gray cursor-pointer">
                      <span className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${n.type === "danger" ? "bg-red-500" : n.type === "warning" ? "bg-amber-500" : "bg-blue-500"}`}></span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{n.title}</p>
                        <p className="text-xs text-gray-400">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 px-4 py-2">
                  <button className="text-xs font-semibold text-canara-blue hover:underline w-full text-center" onClick={() => { setNotifOpen(false); setActiveSection("audit"); }}>
                    View all in Audit Logs →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              id="profile-btn"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-white hover:bg-white/10 transition"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-canara-gold text-canara-blue-dark text-xs font-bold">
                JD
              </div>
              <svg className="h-4 w-4 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-gray-200 bg-white shadow-xl">
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="font-bold text-gray-800">John Doe</p>
                  <p className="text-xs text-gray-400">EMP001245 · {displayRole}</p>
                </div>
                <div className="py-1">
                  {[
                    { label: "View Profile", section: "profile" },
                    { label: "Settings", section: "settings" },
                    { label: "Audit Logs", section: "audit" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-canara-gray"
                      onClick={() => { setActiveSection(item.section); setProfileOpen(false); }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Body: Sidebar + Main ── */}
      <div className="dashboard-body">
        {/* ── Sidebar ── */}
        <aside className={`dashboard-sidebar ${sidebarExpanded ? "expanded" : "collapsed"}`}>
          {/* Nav Items */}
          <nav className="flex-1 py-4 space-y-0.5">
            {navItems.map((item) => (
              <div key={item.id}>
                {item.dividerBefore && sidebarExpanded && (
                  <div className="mx-4 my-2 border-t border-white/10"></div>
                )}
                {item.dividerBefore && !sidebarExpanded && (
                  <div className="my-2"></div>
                )}
                <button
                  id={`nav-${item.id}`}
                  onClick={() => setActiveSection(item.id)}
                  className={`sidebar-nav-item w-full text-left ${activeSection === item.id ? "active" : ""} ${!sidebarExpanded ? "justify-center px-2" : ""}`}
                  title={!sidebarExpanded ? item.label : undefined}
                >
                  {item.icon}
                  {sidebarExpanded && (
                    <span className="truncate">{item.label}</span>
                  )}
                </button>
              </div>
            ))}
          </nav>

          {/* Sidebar Footer: Logout */}
          <div className="border-t border-white/10 py-3 px-2">
            <button
              onClick={handleLogout}
              className={`sidebar-nav-item w-full text-left text-red-300 hover:bg-red-500/20 hover:text-red-200 ${!sidebarExpanded ? "justify-center px-2" : ""}`}
              title={!sidebarExpanded ? "Logout" : undefined}
            >
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {sidebarExpanded && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="dashboard-main" id="main-content">
          {renderSection()}

          {/* Footer */}
          <footer className="mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} Canara Bank — VeriTrust Platform · All activity is monitored and logged
          </footer>
        </main>
      </div>
    </div>
  );
}
