import { Link } from "react-router-dom";

interface CanaraLogoProps {
  variant?: "light" | "dark";
  showTagline?: boolean;
  linkToHome?: boolean;
}

export default function CanaraLogo({
  variant = "light",
  showTagline = true,
  linkToHome = true,
}: CanaraLogoProps) {
  const isLight = variant === "light";

  const content = (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-canara-gold shadow-sm">
        <svg viewBox="0 0 40 40" className="h-7 w-7" aria-hidden="true">
          <circle cx="20" cy="20" r="18" fill="#004792" />
          <path
            d="M12 22 Q20 10 28 22 Q20 28 12 22"
            fill="#FFCC00"
            stroke="#FFCC00"
            strokeWidth="1"
          />
          <circle cx="20" cy="20" r="4" fill="#FFCC00" />
        </svg>
      </div>
      <div>
        <p
          className={`text-lg font-bold leading-tight tracking-wide ${
            isLight ? "text-white" : "text-canara-blue"
          }`}
        >
          CANARA BANK
        </p>
        {showTagline && (
          <p
            className={`text-xs font-medium tracking-wider ${
              isLight ? "text-canara-gold" : "text-canara-blue-light"
            }`}
          >
            Together We Can
          </p>
        )}
        <p className={`text-[10px] ${isLight ? "text-blue-200" : "text-gray-500"}`}>
          VeriTrust Digital Platform
        </p>
      </div>
    </div>
  );

  if (linkToHome) {
    return (
      <Link to="/" className="inline-flex hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
