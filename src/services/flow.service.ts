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

const isRecord = (value: unknown): value is Record<string, any> =>
  typeof value === "object" && value !== null;

const extractFlowPayload = (payload: unknown): Record<string, any> => {
  if (!isRecord(payload)) return {};

  const candidates: unknown[] = [
    payload?.data?.flow,
    payload?.data?.item,
    payload?.data?.row,
    payload?.data?.data?.flow,
    payload?.data?.data?.item,
    payload?.data?.data?.row,
    payload?.flow,
    payload?.item,
    payload?.row,
    payload?.data?.data,
    payload?.data,
    payload,
  ];

  for (const candidate of candidates) {
    if (!isRecord(candidate)) continue;
    if (
      "id" in candidate ||
      "_id" in candidate ||
      "flowId" in candidate ||
      "meta_flow_id" in candidate ||
      "templateKey" in candidate ||
      "template_key" in candidate ||
      "activeVersion" in candidate ||
      "screens" in candidate
    ) {
      return candidate;
    }
  }

  return {};
};

const normalizeOption = (option: any): { label: string; value: string } => ({
  label: option?.label ?? "",
  value: option?.value ?? "",
});

const normalizeComponent = (component: any) => {
  const validation = isRecord(component?.validation) ? component.validation : {};

  return {
    key: component?.key ?? "",
    type: component?.type ?? "input",
    label: component?.label ?? undefined,
    variable_key: component?.variable_key ?? component?.variableKey ?? undefined,
    placeholder: component?.placeholder ?? undefined,
    required:
      typeof component?.required === "boolean"
        ? component.required
        : undefined,
    helper_text: component?.helper_text ?? component?.helperText ?? undefined,
    options: Array.isArray(component?.options)
      ? component.options.map(normalizeOption)
      : undefined,
    min_length:
      component?.min_length ??
      component?.minLength ??
      validation?.min_length ??
      validation?.minLength,
    max_length:
      component?.max_length ??
      component?.maxLength ??
      validation?.max_length ??
      validation?.maxLength,
    min_value:
      component?.min_value ??
      component?.minValue ??
      validation?.min_value ??
      validation?.minValue,
    max_value:
      component?.max_value ??
      component?.maxValue ??
      validation?.max_value ??
      validation?.maxValue,
  };
};

const normalizeAction = (action: any) => ({
  key: action?.key ?? "",
  type: action?.type ?? "submit",
  label: action?.label ?? undefined,
  target_screen_key:
    action?.target_screen_key ??
    action?.targetScreenKey ??
    undefined,
  url: action?.url ?? action?.apiConfig?.url ?? undefined,
  phone: action?.phone ?? action?.phoneNumber ?? undefined,
});

const normalizeScreen = (screen: any) => ({
  key: screen?.key ?? "",
  title: screen?.title ?? "",
  is_entry_point:
    typeof screen?.is_entry_point === "boolean"
      ? screen.is_entry_point
      : Boolean(screen?.isEntryPoint),
  components: Array.isArray(screen?.components)
    ? screen.components.map(normalizeComponent)
    : [],
  actions: Array.isArray(screen?.actions)
    ? screen.actions.map(normalizeAction)
    : [],
});

const extractScreens = (flow: Record<string, any>) => {
  const activeVersion = isRecord(flow?.activeVersion) ? flow.activeVersion : {};
  const candidates = [
    flow?.screens,
    activeVersion?.screens,
    flow?.flow_json?.screens,
    flow?.flowJson?.screens,
    flow?.flow_definition?.screens,
    flow?.flowDefinition?.screens,
    flow?.definition?.screens,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
};

const extractWebhookMapping = (flow: Record<string, any>): Record<string, unknown> | undefined => {
  const activeVersion = isRecord(flow?.activeVersion) ? flow.activeVersion : {};
  const candidate =
    flow?.webhook_mapping ??
    flow?.webhookMapping ??
    activeVersion?.webhook_mapping ??
    activeVersion?.webhookMapping;

  if (isRecord(candidate)) return candidate;
  if (typeof candidate !== "string") return undefined;

  try {
    const parsed = JSON.parse(candidate);
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const normalizeFlow = (input: any): FlowTemplate => {
  const flow = extractFlowPayload(input);
  const activeVersion = isRecord(flow?.activeVersion) ? flow.activeVersion : {};

  return {
    id: flow?.id || flow?._id || flow?.uuid || "",
    flowId: flow?.flowId || flow?.meta_flow_id || flow?.metaFlowId,
    name: flow?.name || "",
    template_key: flow?.template_key || flow?.templateKey || "",
    description: flow?.description || "",
    category: flow?.category || "OTHER",
    status: flow?.status || activeVersion?.status || "UNKNOWN",
    screens: extractScreens(flow).map(normalizeScreen),
    webhook_mapping: extractWebhookMapping(flow),
    createdAt: flow?.createdAt || flow?.created_at,
    updatedAt: flow?.updatedAt || flow?.updated_at,
    version: flow?.version ?? activeVersion?.version ?? flow?.currentDraftVersion,
  };
};

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
  const raw = extractFlowPayload(payload);
  const existingData = payload?.data && typeof payload.data === "object" ? payload.data : {};

  return {
    ...payload,
    data: {
      ...existingData,
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
  const raw = extractFlowPayload(data);
  const existingData = data?.data && typeof data.data === "object" ? data.data : {};

  return {
    ...data,
    data: {
      ...existingData,
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
  const raw = extractFlowPayload(data);
  const existingData = data?.data && typeof data.data === "object" ? data.data : {};

  return {
    ...data,
    data: {
      ...existingData,
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
  const raw = extractFlowPayload(data);
  const existingData = data?.data && typeof data.data === "object" ? data.data : {};

  return {
    ...data,
    data: {
      ...existingData,
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
