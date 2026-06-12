import { Link } from "react-router-dom";
import CanaraLogo from "./CanaraLogo";

interface CanaraHeaderProps {
  variant?: "default" | "auth";
}

export default function CanaraHeader({ variant = "default" }: CanaraHeaderProps) {
  return (
    <>
      <div className="canara-top-bar">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 sm:px-6">
          <span>Welcome to Canara Bank Digital Services</span>
          <div className="hidden gap-4 sm:flex">
            <span>24×7 Support</span>
            <span>|</span>
            <span>Secure Banking</span>
          </div>
        </div>
      </div>

      <header className="border-b-4 border-canara-gold bg-canara-blue shadow-nav">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <CanaraLogo variant="light" />

          {variant === "default" && (
            <nav className="hidden items-center gap-6 md:flex">
              <Link to="/customer/login" className="text-sm font-medium text-white hover:text-canara-gold">
                Customer Login
              </Link>
              <Link to="/customer/register" className="text-sm font-medium text-white hover:text-canara-gold">
                Register
              </Link>
              <Link
                to="/employee/login"
                className="rounded bg-canara-gold px-4 py-2 text-sm font-bold text-canara-blue-dark hover:bg-canara-gold-dark"
              >
                Staff Login
              </Link>
            </nav>
          )}
        </div>
      </header>
    </>
  );
}
