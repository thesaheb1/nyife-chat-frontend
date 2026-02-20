// ============================================================
// Template Types
// ============================================================

export type TemplateCategory = "MARKETING" | "AUTHENTICATION" | "UTILITY";
export type TemplateStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "PAUSED"
  | "DISABLED"
  | "IN_APPEAL"
  | "PENDING_DELETION"
  | "DELETED";
export type TemplateLanguage = string;

export type ComponentType =
  | "HEADER"
  | "BODY"
  | "FOOTER"
  | "BUTTONS"
  | "CAROUSEL";
export type HeaderFormat = "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
export type ButtonType =
  | "URL"
  | "PHONE_NUMBER"
  | "QUICK_REPLY"
  | "OTP"
  | "FLOW";
export type OtpType = "COPY_CODE" | "ONE_TAP" | "ZERO_TAP";

export interface TemplateButton {
  type: ButtonType;
  text: string;
  url?: string;
  phone_number?: string;
  otp_type?: OtpType;
  flow_id?: string;
  flow_action?: string;
  navigate_screen?: string;
}

export interface CarouselCard {
  components: TemplateComponent[];
}

export interface TemplateComponent {
  type: ComponentType;
  format?: HeaderFormat;
  text?: string;
  add_security_recommendation?: boolean;
  buttons?: TemplateButton[];
  cards?: CarouselCard[];
  example?: {
    header_text?: string[];
    header_handle?: string[];
    body_text?: string[][];
  };
}

export interface Template {
  uuid: string;
  id?: string;
  name: string;
  category: TemplateCategory;
  language: TemplateLanguage;
  status: TemplateStatus;
  components: TemplateComponent[];
  meta_template_id?: string;
  created_at: string;
  updated_at: string;
  rejection_reason?: string;
}

export interface CreateTemplatePayload {
  name: string;
  category: TemplateCategory;
  language: TemplateLanguage;
  components: TemplateComponent[];
}

export interface UpdateTemplatePayload {
  category?: TemplateCategory;
  components: TemplateComponent[];
}

export interface ListTemplatesParams {
  limit?: number;
  offset?: number;
  status?: TemplateStatus;
  category?: TemplateCategory;
  search?: string;
}

export interface ListTemplatesResponse {
  data: Template[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}
