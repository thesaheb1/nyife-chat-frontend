import { handleApiResponse } from "@/lib/utils/api-response";
import type {
  ApiResponse,
  Campaign,
  CampaignAnalytics,
  CampaignListParams,
  CampaignListResponse,
  CampaignMessageLog,
  CampaignMessagesParams,
  CampaignMessagesResponse,
  CampaignStatus,
  CreateCampaignPayload,
  ScheduleCampaignPayload,
  UpdateCampaignPayload,
} from "@/types/campaign.types";
import { CAMPAIGN_MESSAGE_STATUSES, CAMPAIGN_STATUSES } from "@/types/campaign.types";

const BASE_URL =
  import.meta.env.VITE_CAMPAIGN_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3004";

type JsonRecord = Record<string, unknown>;

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

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null;

const asString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const asNumber = (value: unknown): number | undefined => {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const asStringOrNumber = (value: unknown): string | number | undefined => {
  if (typeof value === "string" || typeof value === "number") return value;
  return undefined;
};

const normalizeStatus = (value: unknown, fallback: CampaignStatus = "draft"): CampaignStatus => {
  const normalized = asString(value)?.toLowerCase();
  return CAMPAIGN_STATUSES.includes(normalized as CampaignStatus)
    ? (normalized as CampaignStatus)
    : fallback;
};

const normalizeOptionalStatus = (value: unknown): CampaignStatus | undefined => {
  const normalized = asString(value)?.toLowerCase();
  return CAMPAIGN_STATUSES.includes(normalized as CampaignStatus)
    ? (normalized as CampaignStatus)
    : undefined;
};

const normalizeMessageStatus = (value: unknown): CampaignMessageLog["status"] => {
  const normalized = asString(value)?.toLowerCase();
  return CAMPAIGN_MESSAGE_STATUSES.includes(normalized as CampaignMessageLog["status"])
    ? (normalized as CampaignMessageLog["status"])
    : "pending";
};

const parseMetadata = (value: unknown): Record<string, unknown> | null => {
  if (isRecord(value)) return value as Record<string, unknown>;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed);
    return isRecord(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

const extractCampaignPayload = (payload: unknown): JsonRecord => {
  if (!isRecord(payload)) return {};

  const data = isRecord(payload["data"]) ? payload["data"] : {};
  const nestedData = isRecord(data["data"]) ? data["data"] : {};
  const candidates: unknown[] = [
    data["campaign"],
    data["item"],
    data["row"],
    nestedData["campaign"],
    nestedData["item"],
    payload["campaign"],
    payload["item"],
    payload["row"],
    data,
    payload,
  ];

  for (const candidate of candidates) {
    if (!isRecord(candidate)) continue;
    if (
      "id" in candidate ||
      "name" in candidate ||
      "status" in candidate ||
      "template_id" in candidate ||
      "templateId" in candidate
    ) {
      return candidate;
    }
  }

  return {};
};

const normalizeCampaign = (input: unknown): Campaign => {
  const row = extractCampaignPayload(input);
  const groupId = asNumber(row["group_id"] ?? row["groupId"]);

  return {
    id: String(row["id"] ?? ""),
    userId: asStringOrNumber(row["user_id"] ?? row["userId"]),
    name: asString(row["name"]) || "",
    description: asString(row["description"]),
    templateId: asString(row["template_id"] ?? row["templateId"]),
    templateName: asString(row["template_name"] ?? row["templateName"]),
    groupId,
    groupName: asString(row["group_name"] ?? row["groupName"]),
    scheduledAt: (row["scheduled_at"] ?? row["scheduledAt"] ?? null) as string | null,
    startedAt: (row["started_at"] ?? row["startedAt"] ?? null) as string | null,
    status: normalizeStatus(row["status"]),
    sentCount: asNumber(row["sent_count"] ?? row["sentCount"]),
    failedCount: asNumber(row["failed_count"] ?? row["failedCount"]),
    totalRecipients: asNumber(row["total_recipients"] ?? row["totalRecipients"]),
    deliveredCount: asNumber(row["delivered_count"] ?? row["deliveredCount"]),
    readCount: asNumber(row["read_count"] ?? row["readCount"]),
    metadata: parseMetadata(row["metadata"]),
    createdAt: asString(row["created_at"] ?? row["createdAt"]),
    updatedAt: asString(row["updated_at"] ?? row["updatedAt"]),
  };
};

const normalizeAnalytics = (input: unknown): CampaignAnalytics => {
  const data = isRecord(input) ? input : {};

  return {
    campaignId: String(data?.campaignId ?? data?.campaign_id ?? ""),
    campaignName: asString(data?.campaignName ?? data?.campaign_name),
    status: normalizeOptionalStatus(data?.status),
    totalRecipients: asNumber(data?.totalRecipients ?? data?.total_recipients),
    sentCount: asNumber(data?.sent_count ?? data?.sentCount),
    deliveredCount: asNumber(data?.delivered_count ?? data?.deliveredCount),
    readCount: asNumber(data?.read_count ?? data?.readCount),
    failedCount: asNumber(data?.failed_count ?? data?.failedCount),
    pendingCount: asNumber(data?.pending_count ?? data?.pendingCount),
    deliveryRate: asString(data?.deliveryRate ?? data?.delivery_rate),
    readRate: asString(data?.readRate ?? data?.read_rate),
    failureRate: asString(data?.failureRate ?? data?.failure_rate),
  };
};

const normalizeCampaignMessage = (input: unknown): CampaignMessageLog => {
  const row = isRecord(input) ? input : {};

  return {
    id: String(row["id"] ?? ""),
    campaignId: String(row["campaign_id"] ?? row["campaignId"] ?? ""),
    contactId: asStringOrNumber(row["contact_id"] ?? row["contactId"]),
    contactName: asString(row["contact_name"] ?? row["contactName"]),
    phoneNumber: asString(row["phone_number"] ?? row["phoneNumber"]),
    status: normalizeMessageStatus(row["status"]),
    messageId: (row["message_id"] ?? row["messageId"] ?? null) as string | null,
    errorMessage: (row["error_message"] ?? row["errorMessage"] ?? null) as string | null,
    retryCount: asNumber(row["retry_count"] ?? row["retryCount"]),
    sentAt: (row["sent_at"] ?? row["sentAt"] ?? null) as string | null,
    deliveredAt: (row["delivered_at"] ?? row["deliveredAt"] ?? null) as string | null,
    readAt: (row["read_at"] ?? row["readAt"] ?? null) as string | null,
    createdAt: asString(row["created_at"] ?? row["createdAt"]),
    updatedAt: asString(row["updated_at"] ?? row["updatedAt"]),
  };
};

export async function healthCheckCampaignService(): Promise<ApiResponse<unknown>> {
  const res = await fetch(`${BASE_URL}/health`, {
    method: "GET",
  });
  return handleApiResponse(res);
}

export async function listCampaigns(params: CampaignListParams = {}): Promise<CampaignListResponse> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(params.status ? { status: params.status } : {}),
    ...(params.search ? { search: params.search } : {}),
  });

  const res = await fetch(`${BASE_URL}/api/campaigns?${qs.toString()}`, {
    headers: getHeaders(),
  });

  const payload = (await handleApiResponse<unknown>(res)) as JsonRecord;
  const rows = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.rows)
      ? payload.rows
      : Array.isArray(payload?.items)
        ? payload.items
        : [];

  const data = rows.map(normalizeCampaign);
  const count = asNumber(payload?.count) ?? data.length;
  const total = asNumber(payload?.total) ?? count;
  const totalPages =
    asNumber(payload?.totalPages ?? payload?.total_pages) ?? Math.max(1, Math.ceil(total / limit));
  const currentPage = asNumber(payload?.currentPage ?? payload?.current_page) ?? page;

  return {
    data,
    count,
    total,
    totalPages,
    currentPage,
    limit,
  };
}

export async function getCampaign(id: string): Promise<ApiResponse<{ campaign: Campaign }>> {
  const res = await fetch(`${BASE_URL}/api/campaigns/${id}`, {
    headers: getHeaders(),
  });

  const payload = (await handleApiResponse<unknown>(res)) as JsonRecord;
  const raw = extractCampaignPayload(payload);
  const existingData = payload?.data && isRecord(payload.data) ? payload.data : {};

  return {
    ...payload,
    data: {
      ...existingData,
      campaign: normalizeCampaign(raw),
    },
  };
}

export async function createCampaign(
  payload: CreateCampaignPayload
): Promise<ApiResponse<{ campaign: Campaign }>> {
  const body: Record<string, unknown> = {
    name: payload.name,
    ...(payload.description ? { description: payload.description } : {}),
    ...(payload.templateId ? { templateId: payload.templateId } : {}),
    ...(typeof payload.groupId === "number" ? { groupId: payload.groupId } : {}),
    ...(payload.scheduledAt ? { scheduledAt: payload.scheduledAt } : {}),
    ...(payload.status ? { status: payload.status } : {}),
    ...(payload.metadata ? { metadata: payload.metadata } : {}),
  };

  const res = await fetch(`${BASE_URL}/api/campaigns`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  const data = (await handleApiResponse<unknown>(res)) as JsonRecord;
  const raw = extractCampaignPayload(data);
  const existingData = data?.data && isRecord(data.data) ? data.data : {};

  return {
    ...data,
    data: {
      ...existingData,
      campaign: normalizeCampaign(raw),
    },
  };
}

export async function updateCampaign(
  id: string,
  payload: UpdateCampaignPayload
): Promise<ApiResponse<{ campaign: Campaign }>> {
  const body: Record<string, unknown> = {};

  if (payload.name !== undefined) body.name = payload.name;
  if (payload.description !== undefined) body.description = payload.description;
  if (payload.templateId !== undefined) body.template_id = payload.templateId;
  if (payload.groupId !== undefined) body.group_id = payload.groupId;
  if (payload.scheduledAt !== undefined) body.scheduled_at = payload.scheduledAt;
  if (payload.status !== undefined) body.status = payload.status;
  if (payload.metadata !== undefined) body.metadata = payload.metadata;

  const res = await fetch(`${BASE_URL}/api/campaigns/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  const data = (await handleApiResponse<unknown>(res)) as JsonRecord;
  const raw = extractCampaignPayload(data);
  const existingData = data?.data && isRecord(data.data) ? data.data : {};

  return {
    ...data,
    data: {
      ...existingData,
      campaign: normalizeCampaign(raw),
    },
  };
}

export async function deleteCampaign(id: string): Promise<ApiResponse<unknown>> {
  const res = await fetch(`${BASE_URL}/api/campaigns/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  return handleApiResponse(res);
}

export async function executeCampaign(id: string): Promise<ApiResponse<unknown>> {
  const res = await fetch(`${BASE_URL}/api/campaigns/${id}/execute`, {
    method: "POST",
    headers: getHeaders(),
  });
  return handleApiResponse(res);
}

export async function pauseCampaign(id: string): Promise<ApiResponse<unknown>> {
  const res = await fetch(`${BASE_URL}/api/campaigns/${id}/pause`, {
    method: "POST",
    headers: getHeaders(),
  });
  return handleApiResponse(res);
}

export async function resumeCampaign(id: string): Promise<ApiResponse<unknown>> {
  const res = await fetch(`${BASE_URL}/api/campaigns/${id}/resume`, {
    method: "POST",
    headers: getHeaders(),
  });
  return handleApiResponse(res);
}

export async function cancelCampaign(id: string): Promise<ApiResponse<unknown>> {
  const res = await fetch(`${BASE_URL}/api/campaigns/${id}/cancel`, {
    method: "POST",
    headers: getHeaders(),
  });
  return handleApiResponse(res);
}

export async function scheduleCampaign(
  id: string,
  payload: ScheduleCampaignPayload
): Promise<ApiResponse<unknown>> {
  const res = await fetch(`${BASE_URL}/api/campaigns/${id}/schedule`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return handleApiResponse(res);
}

export async function getCampaignAnalytics(
  id: string
): Promise<ApiResponse<{ analytics: CampaignAnalytics }>> {
  const res = await fetch(`${BASE_URL}/api/campaigns/${id}/analytics`, {
    headers: getHeaders(),
  });

  const payload = (await handleApiResponse<unknown>(res)) as JsonRecord;
  const raw = payload?.data ?? payload;
  const existingData = payload?.data && isRecord(payload.data) ? payload.data : {};

  return {
    ...payload,
    data: {
      ...existingData,
      analytics: normalizeAnalytics(raw),
    },
  };
}

export async function getCampaignStats(
  id: string
): Promise<ApiResponse<{ analytics: CampaignAnalytics }>> {
  const res = await fetch(`${BASE_URL}/api/campaigns/${id}/stats`, {
    headers: getHeaders(),
  });

  const payload = (await handleApiResponse<unknown>(res)) as JsonRecord;
  const raw = payload?.data ?? payload;
  const existingData = payload?.data && isRecord(payload.data) ? payload.data : {};

  return {
    ...payload,
    data: {
      ...existingData,
      analytics: normalizeAnalytics(raw),
    },
  };
}

export async function getCampaignMessages(
  id: string,
  params: CampaignMessagesParams = {}
): Promise<CampaignMessagesResponse> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(params.status ? { status: params.status } : {}),
  });

  const res = await fetch(`${BASE_URL}/api/campaigns/${id}/messages?${qs.toString()}`, {
    headers: getHeaders(),
  });

  const payload = (await handleApiResponse<unknown>(res)) as JsonRecord;
  const rows = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.rows)
      ? payload.rows
      : Array.isArray(payload?.items)
        ? payload.items
        : [];

  const data = rows.map(normalizeCampaignMessage);
  const count = asNumber(payload?.count) ?? data.length;
  const total = asNumber(payload?.total) ?? count;
  const totalPages =
    asNumber(payload?.totalPages ?? payload?.total_pages) ?? Math.max(1, Math.ceil(total / limit));
  const currentPage = asNumber(payload?.currentPage ?? payload?.current_page) ?? page;

  return {
    data,
    count,
    total,
    totalPages,
    currentPage,
    limit,
  };
}
