type JsonRecord = Record<string, unknown>;

const MESSAGE_PATHS: string[][] = [
  ["message"],
  ["error", "message"],
  ["error", "details", "metaError", "error_user_msg"],
  ["error", "details", "metaError", "error_user_title"],
  ["error", "details", "metaError", "message"],
  ["error", "details", "message"],
  ["error_description"],
  ["details", "message"],
  ["data", "message"],
];

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null;

const asMessage = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const getByPath = (source: JsonRecord, path: string[]): unknown => {
  let current: unknown = source;

  for (const key of path) {
    if (!isRecord(current) || !(key in current)) return undefined;
    current = current[key];
  }

  return current;
};

const parseBody = async (response: Response): Promise<unknown> => {
  const raw = await response.text().catch(() => "");
  if (!raw) return undefined;

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

const isFailurePayload = (payload: unknown): boolean =>
  isRecord(payload) && "success" in payload && payload.success === false;

export const extractApiMessage = (payload: unknown): string | undefined => {
  if (payload instanceof Error) return asMessage(payload.message);
  if (typeof payload === "string") return asMessage(payload);
  if (!isRecord(payload)) return undefined;

  for (const path of MESSAGE_PATHS) {
    const message = asMessage(getByPath(payload, path));
    if (message) return message;
  }

  return asMessage(payload.error);
};

export class ApiHttpError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiHttpError";
    this.status = status;
    this.payload = payload;
  }
}

export async function handleApiResponse<T>(
  response: Response,
  fallbackMessage: string = "Request failed"
): Promise<T> {
  const payload = await parseBody(response);

  if (!response.ok || isFailurePayload(payload)) {
    const message =
      extractApiMessage(payload) ||
      (response.status ? `HTTP ${response.status}` : fallbackMessage);
    throw new ApiHttpError(message, response.status, payload);
  }

  return (payload ?? {}) as T;
}

export const getApiSuccessMessage = (
  payload: unknown,
  fallbackMessage: string
): string => extractApiMessage(payload) || fallbackMessage;

export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage: string = "Something went wrong"
): string => {
  if (error instanceof Error) {
    const direct = asMessage(error.message);
    if (direct) return direct;
  }

  return extractApiMessage(error) || fallbackMessage;
};
