import { useEffect, useState } from "react";

interface ResendTimerProps {
  seconds: number;
  onResend: () => void;
  disabled?: boolean;
}

export default function ResendTimer({ seconds, onResend, disabled }: ResendTimerProps) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => setRemaining((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [remaining]);

  if (remaining > 0) {
    return (
      <p className="text-center text-sm text-gray-500">
        Resend OTP in <span className="font-semibold text-canara-blue">{remaining}s</span>
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={onResend}
      disabled={disabled}
      className="w-full text-sm font-medium text-canara-blue hover:underline disabled:opacity-50"
    >
      Resend OTP
    </button>
  );
}
