import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, Clock3, Eye, EyeOff, Loader2 } from "lucide-react";
import { NavLink, useSearchParams } from "react-router-dom";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useResendTimer from "@/hooks/use-resend-timer";
import { useRouter } from "@/hooks/use-router";
import getErrorMessage from "@/lib/utils/isErrorInString";
import {
  dismissToast,
  showErrorToast,
  showLoadingToast,
  showSuccessToast,
} from "@/lib/utils/toast";
import { resendOtp, resetPassword } from "@/services/auth.service";
import nyifeLogo from "@/assets/images/nyife-logo.svg";

import AdminOTPInput from "../Components/AdminOTPInput";

type ResetStep = 1 | 2 | 3;

type PasswordStrengthLabel = "Weak" | "Fair" | "Good" | "Strong" | "Very Strong";

interface PasswordForm {
  newPassword: string;
  confirmPassword: string;
}

const evaluatePasswordStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (/[A-Z]/.test(password)) strength += 25;
  if (/[0-9]/.test(password)) strength += 25;
  if (/[^A-Za-z0-9]/.test(password)) strength += 25;
  return strength;
};

const getStrengthText = (strength: number): PasswordStrengthLabel => {
  if (strength < 25) return "Weak";
  if (strength < 50) return "Fair";
  if (strength < 75) return "Good";
  if (strength < 100) return "Strong";
  return "Very Strong";
};

const getStrengthColor = (strength: number): string => {
  if (strength < 25) return "bg-red-500";
  if (strength < 50) return "bg-amber-500";
  if (strength < 75) return "bg-blue-500";
  return "bg-emerald-500";
};

const AdminChangePasswordPage = () => {
  const router = useRouter();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("id")?.trim() || "";

  const [step, setStep] = useState<ResetStep>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    newPassword: "",
    confirmPassword: "",
  });

  const passwordStrength = useMemo(
    () => evaluatePasswordStrength(passwordForm.newPassword),
    [passwordForm.newPassword],
  );

  const { isActive, canResend, formattedTime, startTimer, resetTimer } = useResendTimer(45);

  useEffect(() => {
    startTimer();
  }, [startTimer]);

  const handleVerifyOtp = () => {
    if (!userId) {
      setError("Invalid reset link. Please request a new OTP.");
      return;
    }

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit verification code.");
      return;
    }

    setError("");
    setStep(2);
  };

  const handleSubmitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!userId) {
      setError("Invalid reset link. Please request a new OTP.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (passwordStrength < 75) {
      setError("Password is too weak. Use uppercase, numbers and special characters.");
      return;
    }

    setError("");
    setLoading(true);

    const toastId = showLoadingToast("Updating password...");

    try {
      const response = await resetPassword({
        userId,
        otp,
        password: passwordForm.newPassword,
        confPass: passwordForm.confirmPassword,
      });

      dismissToast(toastId);
      showSuccessToast(response.message || "Password updated successfully");
      setStep(3);
    } catch (caughtError) {
      const message = getErrorMessage(
        caughtError instanceof Error ? caughtError.message : caughtError,
      );

      setError(message);
      dismissToast(toastId);
      showErrorToast(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || !userId) {
      if (!userId) {
        setError("Invalid reset link. Please request a new OTP.");
      }
      return;
    }

    setLoading(true);
    setError("");

    const toastId = showLoadingToast("Resending OTP...");

    try {
      const response = await resendOtp({ userId });
      dismissToast(toastId);
      showSuccessToast(response.message || "OTP resent successfully");
      resetTimer();
    } catch (caughtError) {
      const message = getErrorMessage(
        caughtError instanceof Error ? caughtError.message : caughtError,
      );

      setError(message);
      dismissToast(toastId);
      showErrorToast(message);
    } finally {
      setLoading(false);
    }
  };

  const strengthText = getStrengthText(passwordStrength);
  const strengthColor = getStrengthColor(passwordStrength);

  return (
    <div className="relative z-10 space-y-4">
      {step !== 3 && (
        <Button
          type="button"
          variant="ghost"
          className="-ml-2"
          onClick={() => router.push("/login")}
        >
          <ArrowLeft className="mr-1 size-4" />
          Back to Login
        </Button>
      )}

      {step === 1 && (
        <section className="space-y-4">
          <header className="space-y-3 text-center">
            <NavLink to="/" className="mx-auto flex justify-center">
              <img src={nyifeLogo} alt="NYIFE" className="h-14 w-auto" />
            </NavLink>
            <h1 className="text-2xl font-semibold tracking-tight">Security Verification</h1>
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit verification code sent to your registered email.
            </p>
          </header>

          <AdminOTPInput value={otp} onChange={setOtp} length={6} error={Boolean(error)} />

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button className="w-full" onClick={handleVerifyOtp} disabled={loading || otp.length !== 6}>
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Code"
            )}
          </Button>

          <div className="space-y-2 text-center">
            <p className="text-sm text-muted-foreground">Did not receive the code?</p>

            {isActive ? (
              <Badge variant="secondary" className="mx-auto inline-flex items-center gap-1.5 px-3 py-1">
                <Clock3 className="size-3.5" />
                Resend in {formattedTime}
              </Badge>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResendOtp}
                disabled={!canResend || loading}
              >
                Resend Verification Code
              </Button>
            )}

            <p className="text-xs text-muted-foreground">
              {isActive
                ? "Please wait before requesting a new code."
                : "You can request a new verification code now."}
            </p>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          <header className="space-y-3 text-center">
            <NavLink to="/" className="mx-auto flex justify-center">
              <img src={nyifeLogo} alt="NYIFE" className="h-14 w-auto" />
            </NavLink>
            <h1 className="text-2xl font-semibold tracking-tight">Set New Password</h1>
            <p className="text-sm text-muted-foreground">
              Create a strong password to secure your account.
            </p>
          </header>

          <form className="space-y-4" onSubmit={handleSubmitPassword}>
            <div className="space-y-2">
              <label htmlFor="new-password" className="text-sm font-medium">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(event) => {
                    setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }));
                    setError("");
                  }}
                  required
                  autoComplete="new-password"
                  className="pr-11"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>

            {passwordForm.newPassword && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Password strength</span>
                  <span className="font-medium">{strengthText}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${strengthColor}`}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-medium">
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(event) => {
                    setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }));
                    setError("");
                  }}
                  required
                  autoComplete="new-password"
                  className="pr-11"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4 text-center">
          <header className="space-y-3">
            <NavLink to="/" className="mx-auto flex justify-center">
              <img src={nyifeLogo} alt="NYIFE" className="h-14 w-auto" />
            </NavLink>
            <h1 className="text-2xl font-semibold tracking-tight">Password Updated Successfully</h1>
            <p className="text-sm text-muted-foreground">
              Your password has been updated. Sign in with your new credentials.
            </p>
          </header>

          <Alert>
            <AlertDescription>Please sign in again to continue.</AlertDescription>
          </Alert>

          <Button className="w-full" onClick={() => router.push("/login")}>
            Continue to Login
          </Button>
        </section>
      )}
    </div>
  );
};

export default AdminChangePasswordPage;
