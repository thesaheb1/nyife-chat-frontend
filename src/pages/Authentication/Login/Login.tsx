import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { NavLink } from "react-router-dom";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/hooks/use-router";
import getErrorMessage from "@/lib/utils/isErrorInString";
import {
  dismissToast,
  showErrorToast,
  showLoadingToast,
  showSuccessToast,
} from "@/lib/utils/toast";
import { auth } from "@/redux/slices/userSlice";
import { useAppDispatch } from "@/redux/store/hooks";
import { loginAdmin } from "@/services/auth.service";

interface LoginFormState {
  email: string;
  password: string;
}

const initialFormState: LoginFormState = {
  email: "",
  password: "",
};

const AdminLoginPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState<LoginFormState>(initialFormState);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const toastId = showLoadingToast("Signing in...");

    try {
      const response = await loginAdmin({
        email: formData.email.trim(),
        password: formData.password,
      });
      const userData = response.data;

      if (!userData) {
        throw new Error(response.message || "Unable to sign in.");
      }

      dispatch(auth(userData));

      if (userData.token) {
        localStorage.setItem("jwt_token", userData.token);
      }

      dismissToast(toastId);
      showSuccessToast(response.message || "Login successful");
      router.replace("/");
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
      <header className="mb-6 space-y-3 text-center">
        <NavLink to="/" className="mx-auto flex justify-center">
          <img src="/nyife-icon.svg" alt="NYIFE" className="h-12 w-auto" />
        </NavLink>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome Back</h1>
        <p className="text-sm text-muted-foreground">Sign in to continue.</p>
      </header>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label htmlFor="admin-email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="admin-email"
            type="email"
            value={formData.email}
            onChange={(event) => {
              setFormData((prev) => ({ ...prev, email: event.target.value }));
              setError("");
            }}
            placeholder="you@example.com"
            autoComplete="email"
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="admin-password" className="text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <Input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(event) => {
                setFormData((prev) => ({ ...prev, password: event.target.value }));
                setError("");
              }}
              autoComplete="current-password"
              required
              disabled={loading}
              className="pr-11"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={loading}
              className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="link"
            className="h-auto px-0"
            onClick={() => router.push("/forgot-password")}
            disabled={loading}
          >
            Forgot password?
          </Button>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing In..." : "Sign In"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">Use your account credentials to continue.</p>
      </form>
    </div>
  );
};

export default AdminLoginPage;
