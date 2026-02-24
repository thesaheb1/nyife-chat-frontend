export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface AdminUserData {
  token: string;
  email: string;
  role?: string;
  [key: string]: unknown;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface ForgotPasswordPayload {
  email: string;
}

interface ResetPasswordPayload {
  userId: string;
  otp: string;
  password: string;
  confPass: string;
}

interface ResendOtpPayload {
  userId: string;
}

export interface ForgotPasswordResponseData {
  userId: string;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3003";

const getHeaders = (): HeadersInit => ({
  "Content-Type": "application/json",
});

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const result = (await response.json().catch(() => ({}))) as ApiResponse<T>;

  if (!response.ok || !result.success) {
    throw new Error(result.message || `Request failed with status ${response.status}`);
  }

  return result;
}

async function requestJson<T>(
  path: string,
  method: "POST" | "PUT",
  payload: object,
): Promise<ApiResponse<T>> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse<T>(response);
}

export async function loginAdmin(
  payload: LoginPayload,
): Promise<ApiResponse<AdminUserData>> {
  return requestJson<AdminUserData>("/admin/login", "POST", payload);
}

export async function requestPasswordReset(
  payload: ForgotPasswordPayload,
): Promise<ApiResponse<ForgotPasswordResponseData>> {
  return requestJson<ForgotPasswordResponseData>("/admin/forgetPass", "PUT", payload);
}

export async function resetPassword(
  payload: ResetPasswordPayload,
): Promise<ApiResponse<null>> {
  const body = {
    userId: payload.userId,
    Otp: payload.otp,
    password: payload.password,
    confPass: payload.confPass,
  };

  return requestJson<null>("/admin/resetPass", "PUT", body);
}

export async function resendOtp(
  payload: ResendOtpPayload,
): Promise<ApiResponse<null>> {
  return requestJson<null>("/admin/resendotp", "PUT", payload);
}
