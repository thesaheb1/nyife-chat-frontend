import { handleApiResponse } from "@/lib/utils/api-response";
import type {
  ApiResponse,
  BulkCreateContactsPayload,
  BulkCreateContactsResult,
  Contact,
  ContactGroup,
  ContactGroupLite,
  CreateContactPayload,
  CreateGroupPayload,
  GroupAssignmentPayload,
  GroupContactsResponse,
  ListContactsParams,
  ListContactsResponse,
  ListGroupsParams,
  ListGroupsResponse,
  UpdateContactPayload,
  UpdateGroupPayload,
} from "@/types/contact.types";

const BASE_URL =
  import.meta.env.VITE_CONTACT_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3002";

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
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const asBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") return true;
    if (normalized === "false" || normalized === "0") return false;
  }
  return fallback;
};

const normalizeGroupLite = (input: unknown): ContactGroupLite => {
  const row = isRecord(input) ? input : {};

  return {
    id: asNumber(row.id) || 0,
    name: asString(row.name) || "",
    description: (row.description ?? null) as string | null,
  };
};

const normalizeContact = (input: unknown): Contact => {
  const row = isRecord(input) ? input : {};

  const groupsSource = row.groups;
  const groups = Array.isArray(groupsSource)
    ? groupsSource.map(normalizeGroupLite).filter((group) => group.id > 0)
    : [];

  const groupSource = row.group;
  const group = isRecord(groupSource) ? normalizeGroupLite(groupSource) : null;
  const explicitGroupId = asNumber(row.groupId ?? row.group_id);
  const resolvedGroupId =
    explicitGroupId ??
    (group && group.id > 0 ? group.id : undefined) ??
    groups[0]?.id ??
    null;

  return {
    id: asNumber(row.id) || 0,
    userId: asNumber(row.userId ?? row.user_id),
    firstName: asString(row.firstName ?? row.first_name) || "",
    lastName: asString(row.lastName ?? row.last_name) || "",
    email: asString(row.email) || "",
    phone: asString(row.phone) || "",
    countryCode: asString(row.countryCode ?? row.country_code) || "+91",
    company: (row.company ?? null) as string | null,
    jobTitle: (row.jobTitle ?? row.job_title ?? null) as string | null,
    notes: (row.notes ?? null) as string | null,
    isFavorite: asBoolean(row.isFavorite ?? row.is_favorite, false),
    groupId: resolvedGroupId,
    group,
    groups,
    createdAt: asString(row.createdAt ?? row.created_at),
    updatedAt: asString(row.updatedAt ?? row.updated_at),
  };
};

const normalizeGroup = (input: unknown): ContactGroup => {
  const row = isRecord(input) ? input : {};

  const contacts = Array.isArray(row.contacts) ? row.contacts.map(normalizeContact) : undefined;
  const directContacts = Array.isArray(row.directContacts)
    ? row.directContacts.map(normalizeContact)
    : Array.isArray(row.direct_contacts)
      ? row.direct_contacts.map(normalizeContact)
      : undefined;

  const inferredCount =
    asNumber(row.contactCount ?? row.contact_count) ??
    directContacts?.length ??
    contacts?.length;

  return {
    id: asNumber(row.id) || 0,
    userId: asNumber(row.userId ?? row.user_id),
    name: asString(row.name) || "",
    description: (row.description ?? null) as string | null,
    contactCount: inferredCount,
    contacts,
    directContacts,
    createdAt: asString(row.createdAt ?? row.created_at),
    updatedAt: asString(row.updatedAt ?? row.updated_at),
  };
};

const extractRows = (payload: unknown): unknown[] => {
  if (!isRecord(payload)) return [];

  const rootData = payload.data;
  if (Array.isArray(rootData)) return rootData;

  if (isRecord(rootData)) {
    if (Array.isArray(rootData.rows)) return rootData.rows;
    if (Array.isArray(rootData.data)) return rootData.data;
    if (Array.isArray(rootData.items)) return rootData.items;
  }

  if (Array.isArray(payload.rows)) return payload.rows;
  if (Array.isArray(payload.items)) return payload.items;

  return [];
};

const extractResource = (payload: unknown): JsonRecord => {
  if (!isRecord(payload)) return {};

  const data = isRecord(payload.data) ? payload.data : {};
  const nestedData = isRecord(data.data) ? data.data : {};

  const candidates: unknown[] = [
    data.contact,
    data.group,
    data.item,
    data.row,
    nestedData.contact,
    nestedData.group,
    nestedData.item,
    nestedData.row,
    payload.contact,
    payload.group,
    payload.item,
    payload.row,
    data,
    payload,
  ];

  for (const candidate of candidates) {
    if (!isRecord(candidate)) continue;
    if (
      "id" in candidate ||
      "firstName" in candidate ||
      "first_name" in candidate ||
      "name" in candidate
    ) {
      return candidate;
    }
  }

  return {};
};

export async function healthCheckContactService(): Promise<ApiResponse<unknown>> {
  const res = await fetch(`${BASE_URL}/health`, {
    method: "GET",
  });
  return handleApiResponse(res);
}

export async function listContacts(params: ListContactsParams = {}): Promise<ListContactsResponse> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(params.search ? { search: params.search } : {}),
    ...(params.favorite ? { favorite: "true" } : {}),
    ...(typeof params.groupId === "number" ? { groupId: String(params.groupId) } : {}),
  });

  const res = await fetch(`${BASE_URL}/api/contacts?${query.toString()}`, {
    headers: getHeaders(),
  });

  const payload = (await handleApiResponse<unknown>(res)) as JsonRecord;
  const rows = extractRows(payload);

  const data = rows.map(normalizeContact);
  const count = asNumber(payload.count) ?? data.length;
  const total = asNumber(payload.total) ?? count;
  const totalPages =
    asNumber(payload.totalPages ?? payload.total_pages) ?? Math.max(1, Math.ceil(total / limit));
  const currentPage = asNumber(payload.currentPage ?? payload.current_page) ?? page;

  return {
    data,
    count,
    total,
    totalPages,
    currentPage,
    limit,
  };
}

export async function getContact(id: number | string): Promise<ApiResponse<{ contact: Contact }>> {
  const res = await fetch(`${BASE_URL}/api/contacts/${id}`, {
    headers: getHeaders(),
  });

  const payload = (await handleApiResponse<unknown>(res)) as JsonRecord;
  const raw = extractResource(payload);
  const existingData = isRecord(payload.data) ? payload.data : {};

  return {
    ...payload,
    data: {
      ...existingData,
      contact: normalizeContact(raw),
    },
  };
}

export async function createContact(
  payload: CreateContactPayload
): Promise<ApiResponse<{ contact: Contact }>> {
  const res = await fetch(`${BASE_URL}/api/contacts`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const data = (await handleApiResponse<unknown>(res)) as JsonRecord;
  const raw = extractResource(data);
  const existingData = isRecord(data.data) ? data.data : {};

  return {
    ...data,
    data: {
      ...existingData,
      contact: normalizeContact(raw),
    },
  };
}

export async function updateContact(
  id: number | string,
  payload: UpdateContactPayload
): Promise<ApiResponse<{ contact: Contact }>> {
  const res = await fetch(`${BASE_URL}/api/contacts/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const data = (await handleApiResponse<unknown>(res)) as JsonRecord;
  const raw = extractResource(data);
  const existingData = isRecord(data.data) ? data.data : {};

  return {
    ...data,
    data: {
      ...existingData,
      contact: normalizeContact(raw),
    },
  };
}

export async function deleteContact(id: number | string): Promise<ApiResponse<unknown>> {
  const res = await fetch(`${BASE_URL}/api/contacts/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  return handleApiResponse(res);
}

export async function toggleFavoriteContact(
  id: number | string
): Promise<ApiResponse<{ contact: Contact }>> {
  const res = await fetch(`${BASE_URL}/api/contacts/${id}/favorite`, {
    method: "PATCH",
    headers: getHeaders(),
  });

  const payload = (await handleApiResponse<unknown>(res)) as JsonRecord;
  const raw = extractResource(payload);
  const existingData = isRecord(payload.data) ? payload.data : {};

  return {
    ...payload,
    data: {
      ...existingData,
      contact: normalizeContact(raw),
    },
  };
}

export async function bulkCreateContacts(
  payload: BulkCreateContactsPayload
): Promise<ApiResponse<BulkCreateContactsResult>> {
  const res = await fetch(`${BASE_URL}/api/contacts/bulk`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  return handleApiResponse(res);
}

export async function assignContactsToGroup(
  payload: GroupAssignmentPayload
): Promise<ApiResponse<{ groupId: number; contactIds: number[] }>> {
  const res = await fetch(`${BASE_URL}/api/contacts/assign-to-group`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  return handleApiResponse(res);
}

export async function removeContactsFromGroup(
  payload: GroupAssignmentPayload
): Promise<ApiResponse<unknown>> {
  const res = await fetch(`${BASE_URL}/api/contacts/remove-from-group`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  return handleApiResponse(res);
}

export async function getContactsByGroup(
  groupId: number | string,
  params: Pick<ListContactsParams, "page" | "limit" | "search"> = {}
): Promise<GroupContactsResponse> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(params.search ? { search: params.search } : {}),
  });

  const res = await fetch(`${BASE_URL}/api/contacts/group/${groupId}?${query.toString()}`, {
    headers: getHeaders(),
  });

  const payload = (await handleApiResponse<unknown>(res)) as JsonRecord;
  const rows = extractRows(payload);

  const data = rows.map(normalizeContact);
  const count = asNumber(payload.count) ?? data.length;
  const total = asNumber(payload.total) ?? count;
  const totalPages =
    asNumber(payload.totalPages ?? payload.total_pages) ?? Math.max(1, Math.ceil(total / limit));
  const currentPage = asNumber(payload.currentPage ?? payload.current_page) ?? page;

  return {
    data,
    count,
    total,
    totalPages,
    currentPage,
    limit,
    group: normalizeGroupLite(payload.group),
  };
}

export async function listGroups(params: ListGroupsParams = {}): Promise<ListGroupsResponse> {
  const includeContacts = params.includeContacts ?? true;
  const query = new URLSearchParams({
    includeContacts: includeContacts ? "true" : "false",
    ...(typeof params.page === "number" ? { page: String(params.page) } : {}),
    ...(typeof params.limit === "number" ? { limit: String(params.limit) } : {}),
    ...(typeof params.userId === "number" ? { userId: String(params.userId) } : {}),
  });

  const suffix = query.toString();
  const res = await fetch(`${BASE_URL}/api/groups${suffix ? `?${suffix}` : ""}`, {
    headers: getHeaders(),
  });

  const payload = (await handleApiResponse<unknown>(res)) as JsonRecord;
  const rows = extractRows(payload);

  const data = rows.map(normalizeGroup);
  const count = asNumber(payload.count) ?? data.length;

  return {
    data,
    count,
    total: asNumber(payload.total),
    totalPages: asNumber(payload.totalPages ?? payload.total_pages),
    currentPage: asNumber(payload.currentPage ?? payload.current_page),
    limit: asNumber(payload.limit),
  };
}

export async function getAllGroups(params: ListGroupsParams = {}): Promise<ListGroupsResponse> {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 50),
    ...(typeof params.includeContacts === "boolean"
      ? { includeContacts: params.includeContacts ? "true" : "false" }
      : {}),
    ...(typeof params.userId === "number" ? { userId: String(params.userId) } : {}),
  });

  const res = await fetch(`${BASE_URL}/api/groups/all?${query.toString()}`, {
    headers: getHeaders(),
  });

  const payload = (await handleApiResponse<unknown>(res)) as JsonRecord;
  const rows = extractRows(payload);

  const data = rows.map(normalizeGroup);
  const count = asNumber(payload.count) ?? data.length;

  return {
    data,
    count,
    total: asNumber(payload.total) ?? count,
    totalPages:
      asNumber(payload.totalPages ?? payload.total_pages) ??
      Math.max(1, Math.ceil((asNumber(payload.total) ?? count) / (params.limit ?? 50))),
    currentPage: asNumber(payload.currentPage ?? payload.current_page) ?? (params.page ?? 1),
    limit: params.limit ?? 50,
  };
}

export async function getGroup(id: number | string): Promise<ApiResponse<{ group: ContactGroup }>> {
  const res = await fetch(`${BASE_URL}/api/groups/${id}`, {
    headers: getHeaders(),
  });

  const payload = (await handleApiResponse<unknown>(res)) as JsonRecord;
  const raw = extractResource(payload);
  const existingData = isRecord(payload.data) ? payload.data : {};

  return {
    ...payload,
    data: {
      ...existingData,
      group: normalizeGroup(raw),
    },
  };
}

export async function createGroup(
  payload: CreateGroupPayload
): Promise<ApiResponse<{ group: ContactGroup }>> {
  const res = await fetch(`${BASE_URL}/api/groups`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const data = (await handleApiResponse<unknown>(res)) as JsonRecord;
  const raw = extractResource(data);
  const existingData = isRecord(data.data) ? data.data : {};

  return {
    ...data,
    data: {
      ...existingData,
      group: normalizeGroup(raw),
    },
  };
}

export async function updateGroup(
  id: number | string,
  payload: UpdateGroupPayload
): Promise<ApiResponse<{ group: ContactGroup }>> {
  const res = await fetch(`${BASE_URL}/api/groups/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const data = (await handleApiResponse<unknown>(res)) as JsonRecord;
  const raw = extractResource(data);
  const existingData = isRecord(data.data) ? data.data : {};

  return {
    ...data,
    data: {
      ...existingData,
      group: normalizeGroup(raw),
    },
  };
}

export async function deleteGroup(id: number | string): Promise<ApiResponse<unknown>> {
  const res = await fetch(`${BASE_URL}/api/groups/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  return handleApiResponse(res);
}
