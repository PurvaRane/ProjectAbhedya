import CanaraFooter from "./CanaraFooter";
import CanaraHeader from "./CanaraHeader";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-canara-gray">
      <CanaraHeader variant="auth" />

      <div className="flex flex-1 items-start justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          {(title || subtitle) && (
            <div className="mb-6 rounded-t-lg bg-canara-blue px-6 py-5 text-center">
              {title && <h1 className="text-xl font-bold text-white">{title}</h1>}
              {subtitle && <p className="mt-1 text-sm text-blue-200">{subtitle}</p>}
            </div>
          )}
          <div className={title || subtitle ? "auth-card rounded-t-none border-t-0" : "auth-card"}>
            {children}
          </div>
        </div>
      </div>

      <CanaraFooter />
    </div>
  );
}
