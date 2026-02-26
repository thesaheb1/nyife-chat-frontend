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
import { handleApiResponse } from "@/lib/utils/api-response";

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

const normalizeTemplate = (input: any): Template => ({
  uuid: input?.uuid || input?.id || "",
  id: input?.id || input?.uuid,
  name: input?.name || "",
  category: input?.category || "UTILITY",
  language: input?.language || "en_US",
  status: input?.status || "PENDING",
  components: Array.isArray(input?.components) ? input.components : [],
  meta_template_id: input?.meta_template_id || input?.metaTemplateId,
  created_at: input?.created_at || input?.createdAt || "",
  updated_at: input?.updated_at || input?.updatedAt || "",
  rejection_reason:
    input?.rejection_reason ||
    input?.rejectionReason ||
    input?.rawMetaResponse?.rejected_reason ||
    input?.rawMetaResponse?.rejection_reason,
});

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
  const payload = await handleApiResponse<any>(res);

  const rows =
    payload?.data?.rows ||
    payload?.data?.data ||
    payload?.rows ||
    payload?.data ||
    payload?.items ||
    [];

  const limit =
    Number(payload?.pagination?.limit) ||
    Number(payload?.meta?.pagination?.limit) ||
    Number(params.limit ?? 20);
  const offset =
    Number(payload?.pagination?.offset) ||
    Number(payload?.meta?.pagination?.offset) ||
    Number(params.offset ?? 0);
  const total =
    Number(payload?.pagination?.total) ||
    Number(payload?.meta?.pagination?.total) ||
    Number(payload?.total) ||
    Number(payload?.data?.total) ||
    0;

  const data = Array.isArray(rows) ? rows.map(normalizeTemplate) : [];

  return {
    data,
    total: Number.isFinite(total) && total >= 0 ? total : data.length,
    limit: Number.isFinite(limit) && limit > 0 ? limit : Number(params.limit ?? 20),
    offset: Number.isFinite(offset) && offset >= 0 ? offset : Number(params.offset ?? 0),
  };
}

// ── Get Template ────────────────────────────────────────────
export async function getTemplate(
  uuid: string
): Promise<ApiResponse<{ template: Template }>> {
  const res = await fetch(`${BASE_URL}/api/templates/${uuid}`, {
    headers: getHeaders(),
  });
  const payload = await handleApiResponse<any>(res);
  const raw = payload?.data?.template || payload?.data || payload;
  const existingData = payload?.data && typeof payload.data === "object" ? payload.data : {};

  return {
    ...payload,
    data: {
      ...existingData,
      template: normalizeTemplate(raw),
    },
  };
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
  const data = await handleApiResponse<any>(res);
  const raw = data?.data?.template || data?.data || data;
  const existingData = data?.data && typeof data.data === "object" ? data.data : {};

  return {
    ...data,
    data: {
      ...existingData,
      template: normalizeTemplate(raw),
    },
  };
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
  const data = await handleApiResponse<any>(res);
  const raw = data?.data?.template || data?.data || data;
  const existingData = data?.data && typeof data.data === "object" ? data.data : {};

  return {
    ...data,
    data: {
      ...existingData,
      template: normalizeTemplate(raw),
    },
  };
}

// ── Delete Template ─────────────────────────────────────────
export async function deleteTemplate(
  uuid: string
): Promise<ApiResponse<null>> {
  const res = await fetch(`${BASE_URL}/api/templates/${uuid}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleApiResponse(res);
}

// ── Sync Templates From Meta ────────────────────────────────
export async function syncTemplates(): Promise<ApiResponse<unknown>> {
  const res = await fetch(`${BASE_URL}/api/templates/sync`, {
    method: "POST",
    headers: getHeaders(),
  });
  return handleApiResponse(res);
}

// ── Publish Template ────────────────────────────────────────
export async function publishTemplate(
  uuid: string
): Promise<ApiResponse<unknown>> {
  const res = await fetch(`${BASE_URL}/api/templates/${uuid}/publish`, {
    method: "POST",
    headers: getHeaders(),
  });
  return handleApiResponse(res);
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
  return handleApiResponse(res);
}

// ── Get Template Capabilities ──────────────────────────────
export async function getTemplateCapabilities(): Promise<ApiResponse<TemplateCapabilities>> {
  const res = await fetch(`${BASE_URL}/api/templates/capabilities`, {
    headers: getHeaders(),
  });
  return handleApiResponse(res);
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
  return handleApiResponse(res);
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
  const data = await handleApiResponse<ApiResponse<{ header_handle: string; headerHandle: string }>>(res);
  return {
    header_handle: data.data?.header_handle || data.data?.headerHandle || "",
  };
}
