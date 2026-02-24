import { useEffect, useRef, type KeyboardEvent } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AdminOTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: boolean;
}

const AdminOTPInput = ({
  value,
  onChange,
  length = 6,
  error = false,
}: AdminOTPInputProps) => {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  const handleChange = (index: number, newValue: string) => {
    const digitsOnly = newValue.replace(/\D/g, "");

    if (newValue === "") {
      const otpDigits = value.padEnd(length, " ").split("");
      otpDigits[index] = "";
      onChange(otpDigits.join("").trim());

      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      return;
    }

    if (digitsOnly.length > 1) {
      const pastedValue = digitsOnly.slice(0, length);
      onChange(pastedValue);
      const nextIndex = Math.min(pastedValue.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    if (digitsOnly.length === 1) {
      const otpDigits = value.padEnd(length, " ").split("");
      otpDigits[index] = digitsOnly;
      onChange(otpDigits.join("").trim());

      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="mb-2 flex justify-center gap-2">
      {Array.from({ length }, (_, index) => (
        <Input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          value={value[index] ?? ""}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onFocus={(event) => event.currentTarget.select()}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          aria-label={`OTP digit ${index + 1}`}
          className={cn(
            "h-12 w-11 text-center text-lg font-semibold",
            error && "border-destructive ring-destructive/30",
          )}
        />
      ))}
    </div>
  );
};

export default AdminOTPInput;
