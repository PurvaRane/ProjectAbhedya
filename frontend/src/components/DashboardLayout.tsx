import CanaraLogo from "./CanaraLogo";

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function DashboardLayout({
  title,
  subtitle,
  onLogout,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-canara-gray">
      <div className="canara-top-bar">
        <div className="mx-auto max-w-7xl px-4 py-1.5 text-center sm:px-6 sm:text-left">
          Secure Session Active — Please log out when finished
        </div>
      </div>

      <header className="border-b-4 border-canara-gold bg-canara-blue shadow-nav">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <CanaraLogo variant="light" showTagline={false} />
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-white">{title}</p>
              {subtitle && <p className="text-xs text-canara-gold">{subtitle}</p>}
            </div>
            <button
              onClick={onLogout}
              className="rounded border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main>

      <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} Canara Bank — VeriTrust Platform</p>
      </footer>
    </div>
  );
}
