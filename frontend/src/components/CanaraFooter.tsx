import { Link } from "react-router-dom";

export default function CanaraFooter() {
  return (
    <footer className="mt-auto border-t-4 border-canara-gold bg-canara-blue-dark text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-canara-gold">
              VeriTrust
            </h3>
            <p className="text-sm leading-relaxed text-blue-100">
              AI-powered document verification and fraud detection platform for secure digital banking.
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-canara-gold">
              Customer
            </h3>
            <ul className="space-y-2 text-sm text-blue-100">
              <li><Link to="/customer/login" className="hover:text-canara-gold">Internet Banking Login</Link></li>
              <li><Link to="/customer/register" className="hover:text-canara-gold">New Registration</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-canara-gold">
              Employees
            </h3>
            <ul className="space-y-2 text-sm text-blue-100">
              <li><Link to="/employee/login" className="hover:text-canara-gold">Staff Portal</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-canara-gold">
              Security
            </h3>
            <ul className="space-y-2 text-sm text-blue-100">
              <li>256-bit SSL Encryption</li>
              <li>OTP Verified Access</li>
              <li>Secure Authentication</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-blue-200">
          <p>&copy; {new Date().getFullYear()} Canara Bank. All rights reserved. | VeriTrust Digital Platform</p>
          <p className="mt-1">Authorized Banking Services — Secure • Reliable • Trusted</p>
        </div>
      </div>
    </footer>
  );
}
