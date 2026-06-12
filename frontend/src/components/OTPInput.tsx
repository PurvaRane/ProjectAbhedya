interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function OTPInput({ value, onChange, disabled }: OTPInputProps) {
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
      className="input-field text-center text-2xl tracking-[0.5em]"
      placeholder="000000"
      aria-label="OTP code"
    />
  );
}
