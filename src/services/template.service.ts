import type {
  Template,
  CreateTemplatePayload,
  UpdateTemplatePayload,
  ListTemplatesParams,
  ListTemplatesResponse,
  ApiResponse,
  TemplateValidationResult,
  TemplateCapabilities,
  FlowListItem,
} from "@/types/template.types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3003";

// Pull org/meta headers from env or localStorage
function getHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("jwt_token") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwiZW1haWwiOiJzYWhlYmJjYTIwMjBAZ21haWwuY29tIiwibWV0YUJ1c2luZXNzQWNjb3VudElkIjpudWxsLCJpYXQiOjE3NzE4NDExNjEsImV4cCI6MTc3MTkyNzU2MX0.YgNxmJND-OAWMlf1FHzNsSjyvT1-g-BgE9wo1jhRiEs"}`,
    "x-organization-id":
      localStorage.getItem("organization_id") || "org_demo_001",
    "x-meta-business-account-id":
      localStorage.getItem("meta_business_account_id") || "1468289684238203",
    "x-meta-app-id": localStorage.getItem("meta_app_id") || "1915414522619516",
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err?.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── List Templates ──────────────────────────────────────────
export async function listTemplates(
  params: ListTemplatesParams = {}
): Promise<ListTemplatesResponse> {
  const qs = new URLSearchParams({
    limit: String(params.limit ?? 20),
    offset: String(params.offset ?? 0),
    ...(params.status ? { status: params.status } : {}),
    ...(params.category ? { category: params.category } : {}),
    ...(params.search ? { search: params.search } : {}),
  });
  const res = await fetch(`${BASE_URL}/api/templates?${qs}`, {
    headers: getHeaders(),
  });
  return handleResponse<ListTemplatesResponse>(res);
}

// ── Get Template ────────────────────────────────────────────
export async function getTemplate(
  uuid: string
): Promise<ApiResponse<{ template: Template }>> {
  const res = await fetch(`${BASE_URL}/api/templates/${uuid}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

// ── Create Template ─────────────────────────────────────────
export async function createTemplate(
  payload: CreateTemplatePayload
): Promise<ApiResponse<{ template: Template }>> {
  const res = await fetch(`${BASE_URL}/api/templates`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

// ── Update Template (PUT) ───────────────────────────────────
export async function updateTemplate(
  uuid: string,
  payload: UpdateTemplatePayload
): Promise<ApiResponse<{ template: Template }>> {
  const res = await fetch(`${BASE_URL}/api/templates/${uuid}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

// ── Delete Template ─────────────────────────────────────────
export async function deleteTemplate(
  uuid: string
): Promise<ApiResponse<null>> {
  const res = await fetch(`${BASE_URL}/api/templates/${uuid}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

// ── Sync Templates From Meta ────────────────────────────────
export async function syncTemplates(): Promise<ApiResponse<unknown>> {
  const res = await fetch(`${BASE_URL}/api/templates/sync`, {
    method: "POST",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

// ── Publish Template ────────────────────────────────────────
export async function publishTemplate(
  uuid: string
): Promise<ApiResponse<unknown>> {
  const res = await fetch(`${BASE_URL}/api/templates/${uuid}/publish`, {
    method: "POST",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

// ── Validate Template Payload ──────────────────────────────
export async function validateTemplatePayload(
  payload: CreateTemplatePayload
): Promise<ApiResponse<TemplateValidationResult>> {
  const res = await fetch(`${BASE_URL}/api/templates/validate`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

// ── Get Template Capabilities ──────────────────────────────
export async function getTemplateCapabilities(): Promise<ApiResponse<TemplateCapabilities>> {
  const res = await fetch(`${BASE_URL}/api/templates/capabilities`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

// ── List Flows (for FLOW button selection) ────────────────
export async function listFlows(
  status = "PUBLISHED",
  limit = 100,
  offset = 0
): Promise<ApiResponse<FlowListItem[]>> {
  const qs = new URLSearchParams({
    status,
    limit: String(limit),
    offset: String(offset),
  });
  const res = await fetch(`${BASE_URL}/flows?${qs}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

// ── Upload Media ────────────────────────────────────────────
export async function uploadMedia(file: File): Promise<{ header_handle: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileName", file.name);
  formData.append("fileType", file.type);

  const headers = getHeaders();
  delete (headers as Record<string, string>)["Content-Type"]; // let browser set multipart

  const res = await fetch(`${BASE_URL}/api/templates/media/upload`, {
    method: "POST",
    headers: {
      Authorization: headers.Authorization,
      "x-organization-id": headers["x-organization-id"],
      "x-meta-business-account-id": headers["x-meta-business-account-id"],
      "x-meta-app-id": headers["x-meta-app-id"],
    },
    body: formData,
  });
  const data = await handleResponse<ApiResponse<{ header_handle: string; headerHandle: string }>>(res);
  return {
    header_handle: data.data?.header_handle || data.data?.headerHandle || "",
  };
}
