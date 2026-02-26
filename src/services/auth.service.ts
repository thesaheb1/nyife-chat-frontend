import { handleApiResponse } from "@/lib/utils/api-response";

export interface ApiResponse<T = unknown> {
  success?: boolean;
  message?: string;
  data?: T;
}

export interface LoginUser {
  id: number;
  email: string;
  name?: string;
  role: "user" | "subuser" | "admin" | "subadmin";
  routeList?: unknown[];
  accessRoutes?: unknown[];
  [key: string]: unknown;
}

export interface AuthUserData {
  token: string;
  email: string;
  role: LoginUser["role"];
  id?: number;
  name?: string;
  routeList?: unknown[];
  accessRoutes?: unknown[];
  [key: string]: unknown;
}

interface LoginApiRawResponse {
  message?: string;
  token?: string;
  user?: LoginUser;
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
const AUTH_BASE_URL =
  import.meta.env.VITE_AUTH_API_BASE_URL || "http://localhost:3000/user-service/api";

const getHeaders = (): HeadersInit => ({
  "Content-Type": "application/json",
});

async function parseResponse<T>(
  response: Response,
  fallbackMessage: string,
): Promise<ApiResponse<T>> {
  return handleApiResponse<ApiResponse<T>>(response, fallbackMessage);
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

  return parseResponse<T>(response, "Request failed");
}

export async function loginAdmin(
  payload: LoginPayload,
): Promise<ApiResponse<AuthUserData>> {
  const response = await fetch(`${AUTH_BASE_URL}/auth/login`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const result = await handleApiResponse<LoginApiRawResponse>(response, "Login failed");

  if (!result.token || !result.user?.email || !result.user?.role) {
    throw new Error(result.message || "Login failed");
  }

  return {
    success: true,
    message: result.message || "Login successful",
    data: {
      token: result.token,
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      routeList: result.user.routeList,
      accessRoutes: result.user.accessRoutes,
    },
  };
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
