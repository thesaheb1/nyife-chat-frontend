import { useState, type FormEvent } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { NavLink } from "react-router-dom";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/hooks/use-router";
import { throwFormattedError } from "@/lib/utils/throwFormattedError";
import getErrorMessage from "@/lib/utils/isErrorInString";
import {
  dismissToast,
  showErrorToast,
  showLoadingToast,
  showSuccessToast,
} from "@/lib/utils/toast";
import { requestPasswordReset } from "@/services/auth.service";
import nyifeLogo from "@/assets/images/nyife-logo.svg";

const AdminForgotPasswordPage = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const toastId = showLoadingToast("Sending OTP...");

    try {
      const response = await requestPasswordReset({ email: email.trim() });
      const userId = response.data?.userId?.trim() ?? "";

      if (!userId) {
        throwFormattedError("", response.message, "Unable to process request.");
      }

      dismissToast(toastId);
      showSuccessToast(response.message || "OTP sent successfully");
      router.push(`/reset-password?id=${encodeURIComponent(userId)}`);
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

  return (
    <div className="relative z-10">
      <Button
        type="button"
        variant="ghost"
        className="mb-4 -ml-2"
        onClick={() => router.push("/login")}
      >
        <ArrowLeft className="mr-1 size-4" />
        Back to Login
      </Button>

      <section className="space-y-6">
        <header className="space-y-3 text-center">
          <NavLink to="/" className="mx-auto flex justify-center">
            <img src={nyifeLogo} alt="NYIFE" className="h-14 w-auto" />
          </NavLink>

          <h1 className="text-2xl font-semibold tracking-tight">Reset Password</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email to receive a secure 6-digit verification code.
          </p>
        </header>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="forgot-email" className="text-sm font-medium">
              Email Address
            </label>
            <Input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              placeholder="you@example.com"
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Sending OTP...
              </>
            ) : (
              "Send Reset OTP"
            )}
          </Button>
        </form>
      </section>
    </div>
  );
};

export default AdminForgotPasswordPage;
