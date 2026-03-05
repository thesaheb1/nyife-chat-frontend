export const CAMPAIGN_STATUSES = [
  "draft",
  "scheduled",
  "running",
  "paused",
  "completed",
  "failed",
  "cancelled",
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const CAMPAIGN_MESSAGE_STATUSES = [
  "pending",
  "sent",
  "delivered",
  "failed",
  "read",
] as const;

export type CampaignMessageStatus = (typeof CAMPAIGN_MESSAGE_STATUSES)[number];

export interface Campaign {
  id: string;
  userId?: string | number;
  name: string;
  description?: string;
  templateId?: string;
  templateName?: string;
  groupId?: number;
  groupName?: string;
  scheduledAt?: string | null;
  startedAt?: string | null;
  status: CampaignStatus;
  sentCount?: number;
  failedCount?: number;
  totalRecipients?: number;
  deliveredCount?: number;
  readCount?: number;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CampaignListParams {
  status?: CampaignStatus;
  page?: number;
  limit?: number;
  search?: string;
}

export interface CampaignListResponse {
  data: Campaign[];
  count: number;
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface CreateCampaignPayload {
  name: string;
  description?: string;
  templateId?: string;
  groupId?: number;
  scheduledAt?: string;
  status?: CampaignStatus;
  metadata?: Record<string, unknown>;
}

export interface UpdateCampaignPayload {
  name?: string;
  description?: string;
  templateId?: string;
  groupId?: number;
  scheduledAt?: string | null;
  status?: CampaignStatus;
  metadata?: Record<string, unknown> | string | null;
}

export interface ScheduleCampaignPayload {
  scheduledAt: string;
}

export interface CampaignAnalytics {
  campaignId: string;
  campaignName?: string;
  status?: CampaignStatus;
  totalRecipients?: number;
  sentCount?: number;
  deliveredCount?: number;
  readCount?: number;
  failedCount?: number;
  pendingCount?: number;
  deliveryRate?: string;
  readRate?: string;
  failureRate?: string;
}

export interface CampaignMessagesParams {
  status?: CampaignMessageStatus;
  page?: number;
  limit?: number;
}

export interface CampaignMessageLog {
  id: string;
  campaignId: string;
  contactId?: string | number;
  contactName?: string;
  phoneNumber?: string;
  status: CampaignMessageStatus;
  messageId?: string | null;
  errorMessage?: string | null;
  retryCount?: number;
  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CampaignMessagesResponse {
  data: CampaignMessageLog[];
  count: number;
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}
