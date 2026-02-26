import type {
  ApiResponse,
  CreateFlowPayload,
  FlowListParams,
  FlowListResponse,
  FlowTemplate,
  UpdateFlowPayload,
} from "@/types/flow.types";
import { handleApiResponse } from "@/lib/utils/api-response";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3003";

function getHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("jwt_token") || ""}`,
    "x-organization-id": localStorage.getItem("organization_id") || "org_demo_001",
    "x-meta-business-account-id":
      localStorage.getItem("meta_business_account_id") || "1468289684238203",
    "x-meta-app-id": localStorage.getItem("meta_app_id") || "1915414522619516",
  };
}

const normalizeFlow = (input: any): FlowTemplate => ({
  id: input?.id || input?._id || "",
  flowId: input?.flowId || input?.meta_flow_id,
  name: input?.name || "",
  template_key: input?.template_key || input?.templateKey || "",
  description: input?.description || "",
  category: input?.category || "OTHER",
  status: input?.status || "UNKNOWN",
  screens: Array.isArray(input?.screens) ? input.screens : [],
  webhook_mapping: input?.webhook_mapping,
  createdAt: input?.createdAt || input?.created_at,
  updatedAt: input?.updatedAt || input?.updated_at,
  version: input?.version,
});

type FlowPreviewData = {
  url: string;
  expires_at?: string;
  raw?: unknown;
};

export async function listFlows(params: FlowListParams = {}): Promise<FlowListResponse> {
  const qs = new URLSearchParams({
    limit: String(params.limit ?? 20),
    offset: String(params.offset ?? 0),
    ...(params.status ? { status: params.status } : {}),
    ...(params.category ? { category: params.category } : {}),
    ...(params.search ? { search: params.search } : {}),
  });

  const res = await fetch(`${BASE_URL}/flows?${qs}`, {
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

  const normalizedLimit =
    Number(payload?.pagination?.limit) ||
    Number(payload?.meta?.pagination?.limit) ||
    Number(params.limit ?? 20);
  const normalizedOffset =
    Number(payload?.pagination?.offset) ||
    Number(payload?.meta?.pagination?.offset) ||
    Number(params.offset ?? 0);
  const normalizedTotal =
    Number(payload?.pagination?.total) ||
    Number(payload?.meta?.pagination?.total) ||
    Number(payload?.total) ||
    Number(payload?.data?.total) ||
    0;

  const data = Array.isArray(rows) ? rows.map(normalizeFlow) : [];
  const total = Number.isFinite(normalizedTotal) && normalizedTotal >= 0
    ? normalizedTotal
    : data.length;

  return {
    data,
    total,
    limit: Number.isFinite(normalizedLimit) && normalizedLimit > 0
      ? normalizedLimit
      : Number(params.limit ?? 20),
    offset: Number.isFinite(normalizedOffset) && normalizedOffset >= 0
      ? normalizedOffset
      : Number(params.offset ?? 0),
  };
}

export async function getFlow(id: string, version?: number): Promise<ApiResponse<{ flow: FlowTemplate }>> {
  const query = typeof version === "number" ? `?version=${version}` : "";
  const res = await fetch(`${BASE_URL}/flows/${id}${query}`, {
    headers: getHeaders(),
  });
  const payload = await handleApiResponse<any>(res);
  const raw = payload?.data?.flow || payload?.data || payload;

  return {
    ...payload,
    data: {
      flow: normalizeFlow(raw),
    },
  };
}

export async function createFlow(
  payload: CreateFlowPayload
): Promise<ApiResponse<{ flow: FlowTemplate }>> {
  const res = await fetch(`${BASE_URL}/flows`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await handleApiResponse<any>(res);
  const raw = data?.data?.flow || data?.data || data;

  return {
    ...data,
    data: {
      flow: normalizeFlow(raw),
    },
  };
}

export async function updateFlow(
  id: string,
  payload: UpdateFlowPayload
): Promise<ApiResponse<{ flow: FlowTemplate }>> {
  const res = await fetch(`${BASE_URL}/flows/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await handleApiResponse<any>(res);
  const raw = data?.data?.flow || data?.data || data;

  return {
    ...data,
    data: {
      flow: normalizeFlow(raw),
    },
  };
}

export async function publishFlow(id: string, notes?: string): Promise<ApiResponse<unknown>> {
  const res = await fetch(`${BASE_URL}/flows/${id}/publish`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ notes: notes || "Published from frontend" }),
  });
  return handleApiResponse(res);
}

export async function retireFlow(id: string): Promise<ApiResponse<unknown>> {
  const res = await fetch(`${BASE_URL}/flows/${id}/retire`, {
    method: "POST",
    headers: getHeaders(),
  });
  return handleApiResponse(res);
}

export async function syncFlowStatus(id: string): Promise<ApiResponse<unknown>> {
  const res = await fetch(`${BASE_URL}/flows/${id}/sync-status`, {
    method: "POST",
    headers: getHeaders(),
  });
  return handleApiResponse(res);
}

export async function syncFlowStatuses(
  limit = 100,
  offset = 0,
  reconcile = false
): Promise<ApiResponse<unknown>> {
  const qs = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    ...(reconcile ? { reconcile: "true" } : {}),
  });

  const res = await fetch(`${BASE_URL}/flows/sync-status?${qs}`, {
    method: "POST",
    headers: getHeaders(),
  });
  return handleApiResponse(res);
}

export async function cloneFlow(
  id: string,
  payload: { name: string; template_key: string }
): Promise<ApiResponse<{ flow: FlowTemplate }>> {
  const res = await fetch(`${BASE_URL}/flows/${id}/clone`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await handleApiResponse<any>(res);
  const raw = data?.data?.flow || data?.data || data;

  return {
    ...data,
    data: {
      flow: normalizeFlow(raw),
    },
  };
}

export async function deleteFlow(id: string): Promise<ApiResponse<unknown>> {
  const res = await fetch(`${BASE_URL}/flows/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleApiResponse(res);
}

export async function getFlowPreview(params: {
  id: string;
  metaFlowId?: string;
  invalidate?: boolean;
}): Promise<ApiResponse<FlowPreviewData>> {
  const flowId = (params.metaFlowId || params.id || "").trim();
  if (!flowId) {
    throw new Error("Flow ID is required to build preview URL.");
  }

  const accessToken =
    import.meta.env.VITE_META_ACCESS_TOKEN ||
    localStorage.getItem("meta_access_token") ||
    localStorage.getItem("meta_user_access_token") ||
    "";

  if (!accessToken.trim()) {
    throw new Error("Meta access token is missing. Set VITE_META_ACCESS_TOKEN in .env.");
  }

  const invalidate = params.invalidate ?? false;
  const qs = new URLSearchParams({
    fields: `preview.invalidate(${invalidate ? "true" : "false"})`,
    access_token: accessToken.trim(),
  });

  const res = await fetch(
    `https://graph.facebook.com/v18.0/${encodeURIComponent(flowId)}?${qs.toString()}`,
    {
      method: "GET",
    }
  );

  const payload = await handleApiResponse<any>(res);
  const preview = payload?.preview && typeof payload.preview === "object" ? payload.preview : {};
  const url =
    (typeof preview.preview_url === "string" ? preview.preview_url : undefined) ||
    (typeof payload?.preview_url === "string" ? payload.preview_url : undefined);
  const expiresAt =
    (typeof preview.expires_at === "string" ? preview.expires_at : undefined) ||
    (typeof payload?.expires_at === "string" ? payload.expires_at : undefined);

  if (!url) {
    throw new Error("Meta preview URL not found in Graph API response.");
  }

  return {
    ...(payload || {}),
    data: {
      url,
      expires_at: expiresAt,
      raw: payload,
    },
  };
}
