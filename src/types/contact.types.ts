export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data: T;
}

export interface ContactGroupLite {
  id: number;
  name: string;
  description?: string | null;
}

export interface Contact {
  id: number;
  userId?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode?: string;
  company?: string | null;
  jobTitle?: string | null;
  notes?: string | null;
  isFavorite: boolean;
  groupId?: number | null;
  groups?: ContactGroupLite[];
  group?: ContactGroupLite | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactGroup {
  id: number;
  userId?: number;
  name: string;
  description?: string | null;
  contactCount?: number;
  contacts?: Contact[];
  directContacts?: Contact[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ListContactsParams {
  page?: number;
  limit?: number;
  search?: string;
  favorite?: boolean;
  groupId?: number;
}

export interface ListContactsResponse {
  data: Contact[];
  count: number;
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface ListGroupsParams {
  page?: number;
  limit?: number;
  includeContacts?: boolean;
  userId?: number;
}

export interface ListGroupsResponse {
  data: ContactGroup[];
  count: number;
  total?: number;
  totalPages?: number;
  currentPage?: number;
  limit?: number;
}

export interface CreateContactPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode?: string;
  company?: string;
  jobTitle?: string;
  notes?: string;
  isFavorite?: boolean;
  groupId?: number | null;
}

export interface UpdateContactPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  company?: string;
  jobTitle?: string;
  notes?: string;
  isFavorite?: boolean;
  groupId?: number | null;
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
}

export interface UpdateGroupPayload {
  name?: string;
  description?: string;
}

export interface GroupAssignmentPayload {
  contactIds: number[];
  groupId: number;
}

export interface BulkContactInput {
  firstName: string;
  lastName?: string;
  email?: string;
  phone: string;
  countryCode?: string;
  company?: string;
  jobTitle?: string;
  notes?: string;
}

export interface BulkCreateContactsPayload {
  contacts: BulkContactInput[];
  groupId?: number;
}

export interface BulkCreateContactsResult {
  created: number;
  skipped: number;
  errors: Array<{
    data: Record<string, unknown>;
    error: string;
  }>;
}

export interface GroupContactsResponse extends ListContactsResponse {
  group?: ContactGroupLite;
}
