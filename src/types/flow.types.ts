export const FLOW_CATEGORIES = [
  "LEAD_GENERATION",
  "LEAD_QUALIFICATION",
  "APPOINTMENT_BOOKING",
  "SLOT_BOOKING",
  "ORDER_PLACEMENT",
  "RE_ORDERING",
  "CUSTOMER_SUPPORT",
  "TICKET_CREATION",
  "PAYMENTS",
  "COLLECTIONS",
  "REGISTRATIONS",
  "APPLICATIONS",
  "DELIVERY_UPDATES",
  "ADDRESS_CAPTURE",
  "FEEDBACK",
  "SURVEYS",
  "OTHER",
] as const;

export type FlowCategory = (typeof FLOW_CATEGORIES)[number];

export type FlowStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "DEPRECATED"
  | "ARCHIVED"
  | "UNKNOWN";

export const FLOW_COMPONENT_TYPES = [
  "input",
  "email",
  "textarea",
  "phone",
  "number",
  "date",
  "time",
  "select",
  "radio",
  "checkbox",
  "summary",
  "text",
] as const;

export type FlowComponentType = (typeof FLOW_COMPONENT_TYPES)[number];

export const FLOW_ACTION_TYPES = [
  "next_screen",
  "previous_screen",
  "submit",
  "open_url",
  "call_phone",
] as const;
export type FlowActionType = (typeof FLOW_ACTION_TYPES)[number];

export interface FlowOption {
  label: string;
  value: string;
}

export interface FlowComponent {
  key: string;
  type: FlowComponentType;
  label?: string;
  variable_key?: string;
  placeholder?: string;
  required?: boolean;
  helper_text?: string;
  options?: FlowOption[];
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
}

export interface FlowAction {
  key: string;
  type: FlowActionType;
  label?: string;
  target_screen_key?: string;
  url?: string;
  phone?: string;
}

export interface FlowScreen {
  key: string;
  title: string;
  is_entry_point?: boolean;
  components: FlowComponent[];
  actions: FlowAction[];
}

export interface FlowTemplate {
  id: string;
  flowId?: string;
  name: string;
  template_key: string;
  description?: string;
  category: FlowCategory;
  status?: FlowStatus;
  screens: FlowScreen[];
  webhook_mapping?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
}

export interface FlowListParams {
  limit?: number;
  offset?: number;
  status?: string;
  category?: string;
  search?: string;
}

export interface FlowListResponse {
  data: FlowTemplate[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateFlowPayload {
  name: string;
  template_key: string;
  description?: string;
  category: FlowCategory;
  webhook_mapping?: Record<string, unknown>;
  screens: FlowScreen[];
}

export interface UpdateFlowPayload {
  name: string;
  template_key: string;
  description?: string;
  category: FlowCategory;
  webhook_mapping?: Record<string, unknown>;
  screens: FlowScreen[];
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}
