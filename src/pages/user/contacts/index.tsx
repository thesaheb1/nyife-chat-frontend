import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Filter,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  UploadCloud,
  UserMinus,
  Users,
  X,
} from "lucide-react";

import ContactForm from "@/components/contacts/ContactForm";
import ContactGroupBadge from "@/components/contacts/ContactGroupBadge";
import GroupForm from "@/components/contacts/GroupForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getApiErrorMessage, getApiSuccessMessage } from "@/lib/utils/api-response";
import {
  assignContactsToGroup,
  bulkCreateContacts,
  createContact,
  createGroup,
  deleteContact,
  deleteGroup,
  getContact,
  getContactsByGroup,
  getGroup,
  listContacts,
  listGroups,
  removeContactsFromGroup,
  toggleFavoriteContact,
  updateContact,
  updateGroup,
} from "@/services/contact.service";
import type {
  BulkContactInput,
  Contact,
  ContactGroup,
  CreateContactPayload,
  CreateGroupPayload,
  UpdateContactPayload,
  UpdateGroupPayload,
} from "@/types/contact.types";

const PAGE_SIZES = [10, 20, 50];
const GROUP_CONTACTS_PAGE_SIZE = 20;
const EMPTY_CONTACTS: Contact[] = [];
const EMPTY_GROUPS: ContactGroup[] = [];
const ALL_GROUP_VALUE = "ALL";
const ALL_FAVORITE_VALUE = "ALL";
const FAVORITE_ONLY_VALUE = "FAVORITES";
const ASSIGN_NONE_VALUE = "__unselected__";
const BULK_SAMPLE_PLACEHOLDER = JSON.stringify(
  [
    {
      firstName: "Ananya",
      lastName: "Rao",
      email: "ananya@example.com",
      phone: "9876543210",
      countryCode: "+91",
      company: "Nyife",
      jobTitle: "Marketing Lead",
      notes: "Imported from webinar list",
    },
  ],
  null,
  2
);

type ViewMode = "contacts" | "groups";
type SortDir = "asc" | "desc";
type ContactSortField = "name" | "email" | "phone" | "createdAt";
type GroupSortField = "name" | "contactCount" | "createdAt";
type FavoriteFilter = typeof ALL_FAVORITE_VALUE | typeof FAVORITE_ONLY_VALUE;
type DialogMode = "create" | "edit" | null;
type AssignmentMode = "assign" | "remove" | null;

const toDateTimeDisplay = (value?: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toFullName = (contact: Contact): string =>
  `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || "Unnamed Contact";

function SortIcon({
  active,
  dir,
}: {
  active: boolean;
  dir: SortDir;
}) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />;
  return dir === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5 text-primary" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-primary" />
  );
}

export default function ContactsPage() {
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<ViewMode>("contacts");

  const [contactSearch, setContactSearch] = useState("");
  const [debouncedContactSearch, setDebouncedContactSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>(ALL_GROUP_VALUE);
  const [favoriteFilter, setFavoriteFilter] = useState<FavoriteFilter>(ALL_FAVORITE_VALUE);

  const [contactPage, setContactPage] = useState(0);
  const [contactPageSize, setContactPageSize] = useState(20);

  const [contactSortField, setContactSortField] = useState<ContactSortField>("createdAt");
  const [contactSortDir, setContactSortDir] = useState<SortDir>("desc");

  const [groupSearch, setGroupSearch] = useState("");
  const [groupSortField, setGroupSortField] = useState<GroupSortField>("createdAt");
  const [groupSortDir, setGroupSortDir] = useState<SortDir>("desc");

  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);

  const [contactDialogMode, setContactDialogMode] = useState<DialogMode>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const [groupDialogMode, setGroupDialogMode] = useState<DialogMode>(null);
  const [editingGroup, setEditingGroup] = useState<ContactGroup | null>(null);

  const [deleteContactTarget, setDeleteContactTarget] = useState<Contact | null>(null);
  const [deleteGroupTarget, setDeleteGroupTarget] = useState<ContactGroup | null>(null);

  const [viewContactId, setViewContactId] = useState<number | null>(null);

  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>(null);
  const [assignmentGroupId, setAssignmentGroupId] = useState<string>(ASSIGN_NONE_VALUE);

  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkGroupId, setBulkGroupId] = useState<string>(ASSIGN_NONE_VALUE);
  const [bulkJson, setBulkJson] = useState(BULK_SAMPLE_PLACEHOLDER);

  const [groupContactsTarget, setGroupContactsTarget] = useState<ContactGroup | null>(null);
  const [groupContactsSearch, setGroupContactsSearch] = useState("");
  const [debouncedGroupContactsSearch, setDebouncedGroupContactsSearch] = useState("");
  const [groupContactsPage, setGroupContactsPage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedContactSearch(contactSearch), 400);
    return () => clearTimeout(timer);
  }, [contactSearch]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedGroupContactsSearch(groupContactsSearch), 350);
    return () => clearTimeout(timer);
  }, [groupContactsSearch]);

  useEffect(() => {
    setContactPage(0);
  }, [debouncedContactSearch, groupFilter, favoriteFilter, contactPageSize]);

  useEffect(() => {
    setSelectedContactIds([]);
  }, [debouncedContactSearch, groupFilter, favoriteFilter, contactPage, contactPageSize]);

  const contactQueryParams = useMemo(
    () => ({
      page: contactPage + 1,
      limit: contactPageSize,
      ...(debouncedContactSearch ? { search: debouncedContactSearch } : {}),
      ...(favoriteFilter === FAVORITE_ONLY_VALUE ? { favorite: true } : {}),
      ...(groupFilter !== ALL_GROUP_VALUE ? { groupId: Number(groupFilter) } : {}),
    }),
    [contactPage, contactPageSize, debouncedContactSearch, favoriteFilter, groupFilter]
  );

  const groupsQuery = useQuery({
    queryKey: ["contact-groups"],
    queryFn: () => listGroups({ includeContacts: true }),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const contactsQuery = useQuery({
    queryKey: ["contacts", contactQueryParams],
    queryFn: () => listContacts(contactQueryParams),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const contactDetailsQuery = useQuery({
    queryKey: ["contact-detail", viewContactId],
    enabled: typeof viewContactId === "number" && viewContactId > 0,
    queryFn: async () => {
      if (!viewContactId) throw new Error("Missing contact id");
      const response = await getContact(viewContactId);
      return response.data.contact;
    },
    staleTime: 30 * 1000,
  });

  const groupContactsQuery = useQuery({
    queryKey: ["group-contacts", groupContactsTarget?.id],
    enabled: Boolean(groupContactsTarget?.id),
    queryFn: async () => {
      if (!groupContactsTarget?.id) throw new Error("Missing group id");

      const groupId = groupContactsTarget.id;
      const pageSize = 200;

      const [groupRes, firstPage] = await Promise.all([
        getGroup(groupId),
        getContactsByGroup(groupId, {
          page: 1,
          limit: pageSize,
        }),
      ]);

      let directContacts = [...firstPage.data];
      if (firstPage.totalPages > 1) {
        const restPageRequests: Array<Promise<Awaited<ReturnType<typeof getContactsByGroup>>>> = [];
        for (let page = 2; page <= firstPage.totalPages; page += 1) {
          restPageRequests.push(
            getContactsByGroup(groupId, {
              page,
              limit: pageSize,
            })
          );
        }

        const restPages = await Promise.all(restPageRequests);
        directContacts = [...directContacts, ...restPages.flatMap((response) => response.data)];
      }

      const mappedContacts = groupRes.data.group.contacts || [];

      const merged = new Map<number, Contact>();
      directContacts.forEach((contact) => {
        if (contact.id > 0) merged.set(contact.id, contact);
      });
      mappedContacts.forEach((contact) => {
        if (contact.id <= 0) return;
        const existing = merged.get(contact.id);
        merged.set(contact.id, {
          ...contact,
          ...existing,
          countryCode: existing?.countryCode || contact.countryCode || "+91",
        });
      });

      return Array.from(merged.values());
    },
    staleTime: 30 * 1000,
  });

  const createContactMutation = useMutation({
    mutationFn: (payload: CreateContactPayload) => createContact(payload),
  });

  const updateContactMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateContactPayload }) =>
      updateContact(id, payload),
  });

  const deleteContactMutation = useMutation({
    mutationFn: (id: number) => deleteContact(id),
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: (id: number) => toggleFavoriteContact(id),
  });

  const assignGroupMutation = useMutation({
    mutationFn: ({ groupId, contactIds }: { groupId: number; contactIds: number[] }) =>
      assignContactsToGroup({ groupId, contactIds }),
  });

  const removeGroupMutation = useMutation({
    mutationFn: ({ groupId, contactIds }: { groupId: number; contactIds: number[] }) =>
      removeContactsFromGroup({ groupId, contactIds }),
  });

  const bulkImportMutation = useMutation({
    mutationFn: ({ contacts, groupId }: { contacts: BulkContactInput[]; groupId?: number }) =>
      bulkCreateContacts({ contacts, ...(typeof groupId === "number" ? { groupId } : {}) }),
  });

  const createGroupMutation = useMutation({
    mutationFn: (payload: CreateGroupPayload) => createGroup(payload),
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateGroupPayload }) =>
      updateGroup(id, payload),
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (id: number) => deleteGroup(id),
  });

  useEffect(() => {
    const nextPage = contactPage + 1;
    const total = contactsQuery.data?.total || 0;
    if (!contactsQuery.data) return;
    if (nextPage * contactPageSize >= total) return;

    const nextParams = { ...contactQueryParams, page: nextPage + 1 };
    queryClient.prefetchQuery({
      queryKey: ["contacts", nextParams],
      queryFn: () => listContacts(nextParams),
      staleTime: 60 * 1000,
    });
  }, [contactPage, contactPageSize, contactQueryParams, contactsQuery.data, queryClient]);

  useEffect(() => {
    if (!contactsQuery.error) return;
    toast.error(getApiErrorMessage(contactsQuery.error, "Failed to load contacts"));
  }, [contactsQuery.error, contactsQuery.errorUpdatedAt]);

  useEffect(() => {
    if (!groupsQuery.error) return;
    toast.error(getApiErrorMessage(groupsQuery.error, "Failed to load groups"));
  }, [groupsQuery.error, groupsQuery.errorUpdatedAt]);

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["contacts"] });
    queryClient.invalidateQueries({ queryKey: ["contact-groups"] });
    queryClient.invalidateQueries({ queryKey: ["contact-detail"] });
    queryClient.invalidateQueries({ queryKey: ["group-contacts"] });
  };

  const groups = groupsQuery.data?.data || EMPTY_GROUPS;
  const contacts = contactsQuery.data?.data || EMPTY_CONTACTS;
  const isContactsLoading = contactsQuery.isPending && !contactsQuery.data;

  const totalContacts = contactsQuery.data?.total || 0;
  const totalContactPages = Math.max(1, Math.ceil(totalContacts / contactPageSize));

  const groupsById = useMemo(() => {
    const map = new Map<number, ContactGroup>();
    groups.forEach((group) => {
      if (group.id > 0) map.set(group.id, group);
    });
    return map;
  }, [groups]);

  const sortedContacts = useMemo(() => {
    const list = [...contacts];
    const dir = contactSortDir === "asc" ? 1 : -1;

    list.sort((left, right) => {
      const leftValue = (() => {
        if (contactSortField === "name") return toFullName(left).toLowerCase();
        if (contactSortField === "createdAt") {
          const ts = left.createdAt ? new Date(left.createdAt).getTime() : 0;
          return Number.isFinite(ts) ? ts : 0;
        }
        return String(left[contactSortField] || "").toLowerCase();
      })();

      const rightValue = (() => {
        if (contactSortField === "name") return toFullName(right).toLowerCase();
        if (contactSortField === "createdAt") {
          const ts = right.createdAt ? new Date(right.createdAt).getTime() : 0;
          return Number.isFinite(ts) ? ts : 0;
        }
        return String(right[contactSortField] || "").toLowerCase();
      })();

      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return (leftValue - rightValue) * dir;
      }

      return String(leftValue).localeCompare(String(rightValue)) * dir;
    });

    return list;
  }, [contacts, contactSortDir, contactSortField]);

  const filteredGroups = useMemo(() => {
    if (!groupSearch.trim()) return groups;

    const needle = groupSearch.trim().toLowerCase();
    return groups.filter((group) => {
      return [group.name, group.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [groupSearch, groups]);

  const sortedGroups = useMemo(() => {
    const list = [...filteredGroups];
    const dir = groupSortDir === "asc" ? 1 : -1;

    list.sort((left, right) => {
      const leftValue = (() => {
        if (groupSortField === "contactCount") return Number(left.contactCount || 0);
        if (groupSortField === "createdAt") {
          const ts = left.createdAt ? new Date(left.createdAt).getTime() : 0;
          return Number.isFinite(ts) ? ts : 0;
        }
        return String(left.name || "").toLowerCase();
      })();

      const rightValue = (() => {
        if (groupSortField === "contactCount") return Number(right.contactCount || 0);
        if (groupSortField === "createdAt") {
          const ts = right.createdAt ? new Date(right.createdAt).getTime() : 0;
          return Number.isFinite(ts) ? ts : 0;
        }
        return String(right.name || "").toLowerCase();
      })();

      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return (leftValue - rightValue) * dir;
      }

      return String(leftValue).localeCompare(String(rightValue)) * dir;
    });

    return list;
  }, [filteredGroups, groupSortDir, groupSortField]);

  const hasContactFilters =
    debouncedContactSearch.trim().length > 0 ||
    groupFilter !== ALL_GROUP_VALUE ||
    favoriteFilter !== ALL_FAVORITE_VALUE;

  const visibleContactIds = useMemo(
    () => sortedContacts.map((contact) => contact.id).filter((id) => id > 0),
    [sortedContacts]
  );

  const allVisibleSelected =
    visibleContactIds.length > 0 && visibleContactIds.every((id) => selectedContactIds.includes(id));

  const selectedCount = selectedContactIds.length;

  const closeContactDialog = () => {
    setContactDialogMode(null);
    setEditingContact(null);
  };

  const closeGroupDialog = () => {
    setGroupDialogMode(null);
    setEditingGroup(null);
  };

  const handleContactSort = (field: ContactSortField) => {
    if (contactSortField === field) {
      setContactSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setContactSortField(field);
    setContactSortDir("asc");
  };

  const handleGroupSort = (field: GroupSortField) => {
    if (groupSortField === field) {
      setGroupSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setGroupSortField(field);
    setGroupSortDir("asc");
  };

  const toggleSelectContact = (contactId: number) => {
    setSelectedContactIds((current) => {
      if (current.includes(contactId)) return current.filter((id) => id !== contactId);
      return [...current, contactId];
    });
  };

  const handleToggleSelectAllVisible = () => {
    setSelectedContactIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleContactIds.includes(id));
      }

      const set = new Set(current);
      visibleContactIds.forEach((id) => set.add(id));
      return Array.from(set);
    });
  };

  const handleOpenContactCreate = () => {
    setEditingContact(null);
    setContactDialogMode("create");
  };

  const handleOpenContactEdit = (contact: Contact) => {
    setEditingContact(contact);
    setContactDialogMode("edit");
  };

  const handleOpenGroupCreate = () => {
    setEditingGroup(null);
    setGroupDialogMode("create");
  };

  const handleOpenGroupEdit = (group: ContactGroup) => {
    setEditingGroup(group);
    setGroupDialogMode("edit");
  };

  const handleContactSubmit = async (payload: CreateContactPayload | UpdateContactPayload) => {
    const isUpdate = contactDialogMode === "edit" && editingContact?.id;
    const toastId = toast.loading(isUpdate ? "Saving contact..." : "Creating contact...");

    try {
      const response = isUpdate
        ? await updateContactMutation.mutateAsync({ id: editingContact.id, payload })
        : await createContactMutation.mutateAsync(payload as CreateContactPayload);

      toast.success(
        getApiSuccessMessage(response, isUpdate ? "Contact updated successfully" : "Contact created successfully"),
        {
          id: toastId,
        }
      );

      closeContactDialog();
      refreshAll();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to save contact"), { id: toastId });
    }
  };

  const handleGroupSubmit = async (payload: CreateGroupPayload | UpdateGroupPayload) => {
    const isUpdate = groupDialogMode === "edit" && editingGroup?.id;
    const toastId = toast.loading(isUpdate ? "Saving group..." : "Creating group...");

    try {
      const response = isUpdate
        ? await updateGroupMutation.mutateAsync({ id: editingGroup.id, payload })
        : await createGroupMutation.mutateAsync(payload as CreateGroupPayload);

      toast.success(
        getApiSuccessMessage(response, isUpdate ? "Group updated successfully" : "Group created successfully"),
        {
          id: toastId,
        }
      );

      closeGroupDialog();
      refreshAll();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to save group"), { id: toastId });
    }
  };

  const handleDeleteContact = async () => {
    if (!deleteContactTarget?.id) return;

    const toastId = toast.loading("Deleting contact...");
    try {
      const response = await deleteContactMutation.mutateAsync(deleteContactTarget.id);
      toast.success(getApiSuccessMessage(response, "Contact deleted"), { id: toastId });

      setDeleteContactTarget(null);
      setSelectedContactIds((current) => current.filter((id) => id !== deleteContactTarget.id));
      refreshAll();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete contact"), { id: toastId });
    }
  };

  const handleDeleteGroup = async () => {
    if (!deleteGroupTarget?.id) return;

    const toastId = toast.loading("Deleting group...");
    try {
      const response = await deleteGroupMutation.mutateAsync(deleteGroupTarget.id);
      toast.success(getApiSuccessMessage(response, "Group deleted"), { id: toastId });

      setDeleteGroupTarget(null);
      refreshAll();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete group"), { id: toastId });
    }
  };

  const handleToggleFavorite = async (contact: Contact) => {
    if (!contact.id) return;

    const actionLabel = contact.isFavorite ? "Removing from favorites..." : "Marking as favorite...";
    const toastId = toast.loading(actionLabel);

    try {
      const response = await toggleFavoriteMutation.mutateAsync(contact.id);
      toast.success(
        getApiSuccessMessage(response, contact.isFavorite ? "Removed from favorites" : "Marked as favorite"),
        {
          id: toastId,
        }
      );
      refreshAll();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update favorite status"), { id: toastId });
    }
  };

  const openAssignmentDialog = (mode: AssignmentMode, ids?: number[]) => {
    const nextIds = ids && ids.length > 0 ? ids : selectedContactIds;

    if (nextIds.length === 0) {
      toast.error("Select at least one contact first");
      return;
    }

    setSelectedContactIds(nextIds);
    setAssignmentMode(mode);

    if (mode === "remove" && groupFilter !== ALL_GROUP_VALUE) {
      setAssignmentGroupId(groupFilter);
      return;
    }

    setAssignmentGroupId(ASSIGN_NONE_VALUE);
  };

  const closeAssignmentDialog = () => {
    setAssignmentMode(null);
    setAssignmentGroupId(ASSIGN_NONE_VALUE);
  };

  const handleAssignmentSubmit = async () => {
    if (!assignmentMode) return;
    if (assignmentGroupId === ASSIGN_NONE_VALUE) {
      toast.error("Please select a group");
      return;
    }

    const groupId = Number(assignmentGroupId);
    if (!Number.isInteger(groupId) || groupId <= 0) {
      toast.error("Invalid group selected");
      return;
    }

    if (selectedContactIds.length === 0) {
      toast.error("Select at least one contact first");
      return;
    }

    const loadingMessage =
      assignmentMode === "assign" ? "Assigning contacts to group..." : "Removing contacts from group...";

    const toastId = toast.loading(loadingMessage);

    try {
      const response =
        assignmentMode === "assign"
          ? await assignGroupMutation.mutateAsync({
              groupId,
              contactIds: selectedContactIds,
            })
          : await removeGroupMutation.mutateAsync({
              groupId,
              contactIds: selectedContactIds,
            });

      toast.success(
        getApiSuccessMessage(
          response,
          assignmentMode === "assign" ? "Contacts assigned successfully" : "Contacts removed successfully"
        ),
        { id: toastId }
      );

      closeAssignmentDialog();
      setSelectedContactIds([]);
      refreshAll();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update group assignments"), { id: toastId });
    }
  };

  const handleBulkImport = async () => {
    let parsed: unknown;

    try {
      parsed = JSON.parse(bulkJson);
    } catch {
      toast.error("Bulk JSON is not valid");
      return;
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      toast.error("Bulk JSON must be a non-empty array");
      return;
    }

    const contacts = parsed.map((entry) => {
      if (typeof entry !== "object" || entry === null) return null;
      const row = entry as Record<string, unknown>;

      return {
        firstName: String(row.firstName || "").trim(),
        lastName: String(row.lastName || "").trim() || undefined,
        email: String(row.email || "").trim() || undefined,
        phone: String(row.phone || "").trim(),
        countryCode: String(row.countryCode || "").trim() || "+91",
        company: String(row.company || "").trim() || undefined,
        jobTitle: String(row.jobTitle || "").trim() || undefined,
        notes: String(row.notes || "").trim() || undefined,
      };
    });

    if (contacts.some((contact) => !contact || !contact.firstName || !contact.phone)) {
      toast.error("Each contact must include at least firstName and phone");
      return;
    }

    const hasBulkGroup = bulkGroupId !== ASSIGN_NONE_VALUE;
    const parsedGroupId = hasBulkGroup ? Number(bulkGroupId) : undefined;
    if (
      hasBulkGroup &&
      (typeof parsedGroupId !== "number" ||
        !Number.isInteger(parsedGroupId) ||
        parsedGroupId <= 0)
    ) {
      toast.error("Invalid group selected for bulk import");
      return;
    }

    const toastId = toast.loading("Importing contacts...");

    try {
      const response = await bulkImportMutation.mutateAsync({
        contacts: contacts.filter(Boolean) as BulkContactInput[],
        ...(typeof parsedGroupId === "number" ? { groupId: parsedGroupId } : {}),
      });

      const summary = response.data;
      const message =
        typeof summary?.created === "number" && typeof summary?.skipped === "number"
          ? `Bulk import done: ${summary.created} created, ${summary.skipped} skipped`
          : "Bulk import completed";

      toast.success(getApiSuccessMessage(response, message), { id: toastId });

      setBulkDialogOpen(false);
      setBulkGroupId(ASSIGN_NONE_VALUE);
      setBulkJson(BULK_SAMPLE_PLACEHOLDER);
      refreshAll();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Bulk import failed"), { id: toastId });
    }
  };

  const handleOpenGroupContacts = (group: ContactGroup) => {
    setGroupContactsTarget(group);
    setGroupContactsSearch("");
    setDebouncedGroupContactsSearch("");
    setGroupContactsPage(0);
  };

  const contactDialogDefaultValues = useMemo(() => {
    if (!editingContact) return undefined;

    return {
      firstName: editingContact.firstName || "",
      lastName: editingContact.lastName || "",
      email: editingContact.email || "",
      phone: editingContact.phone || "",
      countryCode: editingContact.countryCode || "+91",
      company: editingContact.company || "",
      jobTitle: editingContact.jobTitle || "",
      notes: editingContact.notes || "",
      groupId:
        typeof editingContact.groupId === "number" && editingContact.groupId > 0
          ? String(editingContact.groupId)
          : undefined,
      isFavorite: Boolean(editingContact.isFavorite),
    };
  }, [editingContact]);

  const groupDialogDefaultValues = useMemo(() => {
    if (!editingGroup) return undefined;

    return {
      name: editingGroup.name || "",
      description: editingGroup.description || "",
    };
  }, [editingGroup]);

  const groupContactsAll = groupContactsQuery.data || EMPTY_CONTACTS;
  const filteredGroupContacts = useMemo(() => {
    if (!debouncedGroupContactsSearch.trim()) return groupContactsAll;

    const needle = debouncedGroupContactsSearch.trim().toLowerCase();
    return groupContactsAll.filter((contact) =>
      [
        toFullName(contact),
        contact.email,
        contact.phone,
        contact.company,
        contact.jobTitle,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [debouncedGroupContactsSearch, groupContactsAll]);

  const groupContactsTotal = filteredGroupContacts.length;
  const groupContactsTotalPages = Math.max(
    1,
    Math.ceil(groupContactsTotal / GROUP_CONTACTS_PAGE_SIZE)
  );
  const groupContacts = useMemo(() => {
    const start = groupContactsPage * GROUP_CONTACTS_PAGE_SIZE;
    const end = start + GROUP_CONTACTS_PAGE_SIZE;
    return filteredGroupContacts.slice(start, end);
  }, [filteredGroupContacts, groupContactsPage]);

  useEffect(() => {
    const maxPage = Math.max(groupContactsTotalPages - 1, 0);
    if (groupContactsPage > maxPage) setGroupContactsPage(maxPage);
  }, [groupContactsPage, groupContactsTotalPages]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Contacts & Groups</h1>
        <p className="text-sm text-muted-foreground">
          Manage contact records, favorites, bulk import and group segmentation from one workspace.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={viewMode === "contacts" ? "default" : "outline"}
          className="h-9 gap-1.5"
          onClick={() => setViewMode("contacts")}
        >
          <Users className="h-4 w-4" />
          Contacts
        </Button>
        <Button
          size="sm"
          variant={viewMode === "groups" ? "default" : "outline"}
          className="h-9 gap-1.5"
          onClick={() => setViewMode("groups")}
        >
          <FolderOpen className="h-4 w-4" />
          Groups
        </Button>
      </div>

      {viewMode === "contacts" ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-wrap gap-2">
              <div className="relative min-w-[220px] max-w-xs flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  value={contactSearch}
                  onChange={(event) => {
                    setContactSearch(event.target.value);
                    setContactPage(0);
                  }}
                  className="h-9 pl-8"
                />
                {contactSearch && (
                  <button
                    type="button"
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    onClick={() => setContactSearch("")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <Select
                value={groupFilter}
                onValueChange={(value) => {
                  setGroupFilter(value);
                  setContactPage(0);
                }}
              >
                <SelectTrigger className="h-9 w-[190px]">
                  <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Filter by group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_GROUP_VALUE}>All Groups</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={String(group.id)}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={favoriteFilter}
                onValueChange={(value) => {
                  setFavoriteFilter(value as FavoriteFilter);
                  setContactPage(0);
                }}
              >
                <SelectTrigger className="h-9 w-[170px]">
                  <Star className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Favorite" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FAVORITE_VALUE}>All Contacts</SelectItem>
                  <SelectItem value={FAVORITE_ONLY_VALUE}>Favorites Only</SelectItem>
                </SelectContent>
              </Select>

              {hasContactFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-1.5 text-xs"
                  onClick={() => {
                    setContactSearch("");
                    setGroupFilter(ALL_GROUP_VALUE);
                    setFavoriteFilter(ALL_FAVORITE_VALUE);
                    setContactPage(0);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>

            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5"
                onClick={refreshAll}
                disabled={contactsQuery.isFetching || groupsQuery.isFetching}
              >
                <RefreshCw
                  className={`h-4 w-4 ${contactsQuery.isFetching || groupsQuery.isFetching ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5"
                onClick={() => setBulkDialogOpen(true)}
              >
                <UploadCloud className="h-4 w-4" />
                Bulk Import
              </Button>

              <Button size="sm" className="h-9 gap-1.5" onClick={handleOpenContactCreate}>
                <Plus className="h-4 w-4" />
                New Contact
              </Button>
            </div>
          </div>

          {!isContactsLoading && (
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>
                <span className="font-semibold text-foreground">{totalContacts}</span>{" "}
                {totalContacts === 1 ? "contact" : "contacts"}
                {hasContactFilters && " (filtered)"}
              </span>
            </div>
          )}

          {selectedCount > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
              <p className="text-sm text-foreground">
                <span className="font-semibold">{selectedCount}</span> contact{selectedCount > 1 ? "s" : ""} selected
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => openAssignmentDialog("assign")}>
                  <Users className="h-3.5 w-3.5" />
                  Assign Group
                </Button>
                <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => openAssignmentDialog("remove")}>
                  <UserMinus className="h-3.5 w-3.5" />
                  Remove Group
                </Button>
                <Button size="sm" variant="ghost" className="h-8" onClick={() => setSelectedContactIds([])}>
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="h-full overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 border-b border-border bg-muted/80 backdrop-blur">
                  <tr>
                    <th className="w-12 px-4 py-3 text-left font-medium text-muted-foreground">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border"
                        checked={allVisibleSelected}
                        onChange={handleToggleSelectAllVisible}
                        aria-label="Select all visible contacts"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      <button
                        className="flex items-center gap-1.5 transition-colors hover:text-foreground"
                        onClick={() => handleContactSort("name")}
                      >
                        Name
                        <SortIcon active={contactSortField === "name"} dir={contactSortDir} />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      <button
                        className="flex items-center gap-1.5 transition-colors hover:text-foreground"
                        onClick={() => handleContactSort("email")}
                      >
                        Email
                        <SortIcon active={contactSortField === "email"} dir={contactSortDir} />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      <button
                        className="flex items-center gap-1.5 transition-colors hover:text-foreground"
                        onClick={() => handleContactSort("phone")}
                      >
                        Phone
                        <SortIcon active={contactSortField === "phone"} dir={contactSortDir} />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Groups</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Favorite</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      <button
                        className="flex items-center gap-1.5 transition-colors hover:text-foreground"
                        onClick={() => handleContactSort("createdAt")}
                      >
                        Created
                        <SortIcon active={contactSortField === "createdAt"} dir={contactSortDir} />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {isContactsLoading ? (
                    Array.from({ length: 8 }).map((_, rowIndex) => (
                      <tr key={rowIndex}>
                        {Array.from({ length: 8 }).map((__, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-3">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : contactsQuery.isError && sortedContacts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                          <FileText className="h-10 w-10 opacity-30" />
                          <div>
                            <p className="text-sm font-medium">Failed to load contacts</p>
                            <p className="mt-0.5 text-xs">Please try again</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-1 gap-1.5"
                            onClick={() => contactsQuery.refetch()}
                          >
                            <RefreshCw className="h-4 w-4" /> Retry
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : sortedContacts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                          <FileText className="h-10 w-10 opacity-30" />
                          <div>
                            <p className="text-sm font-medium">No contacts found</p>
                            <p className="mt-0.5 text-xs">
                              {hasContactFilters
                                ? "Try clearing your filters"
                                : "Create your first contact to get started"}
                            </p>
                          </div>
                          {!hasContactFilters && (
                            <Button size="sm" className="mt-1 gap-1.5" onClick={handleOpenContactCreate}>
                              <Plus className="h-4 w-4" /> New Contact
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedContacts.map((contact) => {
                      const selected = selectedContactIds.includes(contact.id);

                      const displayGroupMap = new Map<number, string>();
                      if (typeof contact.groupId === "number") {
                        const label =
                          contact.group?.name || groupsById.get(contact.groupId)?.name || `Group ${contact.groupId}`;
                        displayGroupMap.set(contact.groupId, label);
                      }
                      (contact.groups || []).forEach((group) => {
                        if (group.id > 0) displayGroupMap.set(group.id, group.name);
                      });

                      const displayGroups = Array.from(displayGroupMap.entries());

                      return (
                        <tr key={contact.id} className="group transition-colors hover:bg-muted/40">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-border"
                              checked={selected}
                              onChange={() => toggleSelectContact(contact.id)}
                              aria-label={`Select ${toFullName(contact)}`}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <p className="font-medium text-foreground">{toFullName(contact)}</p>
                              <span className="text-[10px] text-muted-foreground">#{contact.id}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{contact.email || "—"}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            <div className="flex flex-col">
                              <span>
                                {contact.countryCode || ""} {contact.phone || "—"}
                              </span>
                              {contact.company ? (
                                <span className="text-[10px]">{contact.company}</span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {displayGroups.length === 0 ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {displayGroups.slice(0, 2).map(([id, name]) => (
                                  <ContactGroupBadge
                                    key={id}
                                    groupId={id}
                                    name={name}
                                    className="text-[10px] font-normal"
                                  />
                                ))}
                                {displayGroups.length > 2 ? (
                                  <Badge variant="outline" className="text-[10px] font-normal">
                                    +{displayGroups.length - 2}
                                  </Badge>
                                ) : null}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => handleToggleFavorite(contact)}
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <Star
                                className={`h-3.5 w-3.5 ${
                                  contact.isFavorite ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground"
                                }`}
                              />
                              {contact.isFavorite ? "Favorite" : "No"}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {toDateTimeDisplay(contact.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => setViewContactId(contact.id)}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleOpenContactEdit(contact)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                              </Tooltip>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => setViewContactId(contact.id)}>
                                    <Eye className="mr-2 h-4 w-4" /> View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleOpenContactEdit(contact)}>
                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => openAssignmentDialog("assign", [contact.id])}>
                                    <Users className="mr-2 h-4 w-4" /> Assign to Group
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openAssignmentDialog("remove", [contact.id])}>
                                    <UserMinus className="mr-2 h-4 w-4" /> Remove from Group
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive" onClick={() => setDeleteContactTarget(contact)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {!isContactsLoading && totalContacts > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>Rows per page:</span>
                <Select
                  value={String(contactPageSize)}
                  onValueChange={(value) => {
                    setContactPageSize(Number(value));
                    setContactPage(0);
                  }}
                >
                  <SelectTrigger className="h-7 w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((size) => (
                      <SelectItem key={size} value={String(size)} className="text-xs">
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">
                  {contactPage * contactPageSize + 1}–{Math.min((contactPage + 1) * contactPageSize, totalContacts)} of{" "}
                  {totalContacts}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={contactPage === 0}
                    onClick={() => setContactPage((prev) => prev - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={contactPage >= totalContactPages - 1}
                    onClick={() => setContactPage((prev) => prev + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-wrap gap-2">
              <div className="relative min-w-[220px] max-w-xs flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search groups..."
                  value={groupSearch}
                  onChange={(event) => setGroupSearch(event.target.value)}
                  className="h-9 pl-8"
                />
                {groupSearch && (
                  <button
                    type="button"
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    onClick={() => setGroupSearch("")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5"
                onClick={refreshAll}
                disabled={groupsQuery.isFetching}
              >
                <RefreshCw className={`h-4 w-4 ${groupsQuery.isFetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button size="sm" className="h-9 gap-1.5" onClick={handleOpenGroupCreate}>
                <Plus className="h-4 w-4" />
                New Group
              </Button>
            </div>
          </div>

          {!groupsQuery.isLoading && (
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>
                <span className="font-semibold text-foreground">{sortedGroups.length}</span>{" "}
                {sortedGroups.length === 1 ? "group" : "groups"}
              </span>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="h-full overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 border-b border-border bg-muted/80 backdrop-blur">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      <button
                        className="flex items-center gap-1.5 transition-colors hover:text-foreground"
                        onClick={() => handleGroupSort("name")}
                      >
                        Group
                        <SortIcon active={groupSortField === "name"} dir={groupSortDir} />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      <button
                        className="flex items-center gap-1.5 transition-colors hover:text-foreground"
                        onClick={() => handleGroupSort("contactCount")}
                      >
                        Contacts
                        <SortIcon active={groupSortField === "contactCount"} dir={groupSortDir} />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      <button
                        className="flex items-center gap-1.5 transition-colors hover:text-foreground"
                        onClick={() => handleGroupSort("createdAt")}
                      >
                        Created
                        <SortIcon active={groupSortField === "createdAt"} dir={groupSortDir} />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {groupsQuery.isLoading ? (
                    Array.from({ length: 8 }).map((_, rowIndex) => (
                      <tr key={rowIndex}>
                        {Array.from({ length: 5 }).map((__, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-3">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : groupsQuery.isError && sortedGroups.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                          <FileText className="h-10 w-10 opacity-30" />
                          <div>
                            <p className="text-sm font-medium">Failed to load groups</p>
                            <p className="mt-0.5 text-xs">Please try again</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-1 gap-1.5"
                            onClick={() => groupsQuery.refetch()}
                          >
                            <RefreshCw className="h-4 w-4" /> Retry
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : sortedGroups.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                          <FileText className="h-10 w-10 opacity-30" />
                          <div>
                            <p className="text-sm font-medium">No groups found</p>
                            <p className="mt-0.5 text-xs">Create your first group to organize contacts</p>
                          </div>
                          <Button size="sm" className="mt-1 gap-1.5" onClick={handleOpenGroupCreate}>
                            <Plus className="h-4 w-4" /> New Group
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedGroups.map((group) => (
                      <tr key={group.id} className="group transition-colors hover:bg-muted/40">
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <p className="font-medium text-foreground">{group.name}</p>
                            <span className="text-[10px] text-muted-foreground">#{group.id}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{group.description || "—"}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs font-medium">
                            {group.contactCount || 0}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{toDateTimeDisplay(group.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleOpenGroupContacts(group)}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View Contacts</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleOpenGroupEdit(group)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleOpenGroupContacts(group)}>
                                  <Eye className="mr-2 h-4 w-4" /> View Contacts
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenGroupEdit(group)}>
                                  <Pencil className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteGroupTarget(group)}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Dialog open={contactDialogMode !== null} onOpenChange={(open) => !open && closeContactDialog()}>
        <DialogContent className="w-[min(96vw,1000px)] max-w-none">
          <DialogHeader>
            <DialogTitle>{contactDialogMode === "edit" ? "Edit Contact" : "Create Contact"}</DialogTitle>
            <DialogDescription>
              {contactDialogMode === "edit"
                ? "Update contact details and group mapping."
                : "Add a new contact record for campaigns and flows."}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[72vh] overflow-y-auto pr-1">
            <ContactForm
              defaultValues={contactDialogDefaultValues}
              groups={groups}
              onSubmit={handleContactSubmit}
              isLoading={createContactMutation.isPending || updateContactMutation.isPending}
              submitLabel={contactDialogMode === "edit" ? "Save Contact" : "Create Contact"}
              onCancel={closeContactDialog}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={groupDialogMode !== null} onOpenChange={(open) => !open && closeGroupDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{groupDialogMode === "edit" ? "Edit Group" : "Create Group"}</DialogTitle>
            <DialogDescription>
              {groupDialogMode === "edit"
                ? "Update this group used for segmentation and campaigns."
                : "Create a new group to organize and target contacts."}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[72vh] overflow-y-auto pr-1">
            <GroupForm
              defaultValues={groupDialogDefaultValues}
              onSubmit={handleGroupSubmit}
              isLoading={createGroupMutation.isPending || updateGroupMutation.isPending}
              submitLabel={groupDialogMode === "edit" ? "Save Group" : "Create Group"}
              onCancel={closeGroupDialog}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteContactTarget)} onOpenChange={(open) => !open && setDeleteContactTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{deleteContactTarget ? toFullName(deleteContactTarget) : ""}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteContactTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteContact} disabled={deleteContactMutation.isPending}>
              Delete Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteGroupTarget)} onOpenChange={(open) => !open && setDeleteGroupTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{deleteGroupTarget?.name}</span>? Contacts in this group may be deleted by backend cascade rules.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteGroupTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteGroup} disabled={deleteGroupMutation.isPending}>
              Delete Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewContactId !== null} onOpenChange={(open) => !open && setViewContactId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
            <DialogDescription>View full contact information and current group mappings.</DialogDescription>
          </DialogHeader>

          {contactDetailsQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : contactDetailsQuery.isError ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              {getApiErrorMessage(contactDetailsQuery.error, "Failed to load contact details")}
            </div>
          ) : contactDetailsQuery.data ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-3">
                <p className="text-sm font-semibold text-foreground">{toFullName(contactDetailsQuery.data)}</p>
                <p className="mt-1 text-xs text-muted-foreground">ID: {contactDetailsQuery.data.id}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailCard label="Email" value={contactDetailsQuery.data.email || "—"} />
                <DetailCard
                  label="Phone"
                  value={`${contactDetailsQuery.data.countryCode || ""} ${contactDetailsQuery.data.phone || "—"}`}
                />
                <DetailCard label="Company" value={contactDetailsQuery.data.company || "—"} />
                <DetailCard label="Job Title" value={contactDetailsQuery.data.jobTitle || "—"} />
                <DetailCard
                  label="Favorite"
                  value={contactDetailsQuery.data.isFavorite ? "Yes" : "No"}
                />
                <DetailCard
                  label="Created"
                  value={toDateTimeDisplay(contactDetailsQuery.data.createdAt)}
                />
              </div>

              <div className="rounded-lg border border-border p-3">
                <p className="text-xs font-medium text-muted-foreground">Notes</p>
                <p className="mt-1 text-sm text-foreground">{contactDetailsQuery.data.notes || "—"}</p>
              </div>

              <div className="rounded-lg border border-border p-3">
                <p className="text-xs font-medium text-muted-foreground">Groups</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(contactDetailsQuery.data.groups || []).length > 0 ? (
                    contactDetailsQuery.data.groups?.map((group) => (
                      <ContactGroupBadge key={group.id} groupId={group.id} name={group.name} />
                    ))
                  ) : contactDetailsQuery.data.groupId ? (
                    <ContactGroupBadge
                      groupId={contactDetailsQuery.data.groupId}
                      name={groupsById.get(contactDetailsQuery.data.groupId)?.name || `Group ${contactDetailsQuery.data.groupId}`}
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">No groups assigned</span>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={assignmentMode !== null} onOpenChange={(open) => !open && closeAssignmentDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{assignmentMode === "assign" ? "Assign Contacts to Group" : "Remove Contacts from Group"}</DialogTitle>
            <DialogDescription>
              {assignmentMode === "assign"
                ? `Assign ${selectedCount} selected contact${selectedCount > 1 ? "s" : ""} to a group.`
                : `Remove ${selectedCount} selected contact${selectedCount > 1 ? "s" : ""} from a group.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Select Group</Label>
            <Select value={assignmentGroupId} onValueChange={setAssignmentGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ASSIGN_NONE_VALUE}>Select Group</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={String(group.id)}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeAssignmentDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignmentSubmit}
              disabled={assignGroupMutation.isPending || removeGroupMutation.isPending}
            >
              {assignmentMode === "assign" ? "Assign" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="w-[min(96vw,900px)] max-w-none">
          <DialogHeader>
            <DialogTitle>Bulk Import Contacts</DialogTitle>
            <DialogDescription>
              Paste a JSON array of contacts. Each item must include at least `firstName` and `phone`.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Assign Imported Contacts to Group (Optional)</Label>
              <Select value={bulkGroupId} onValueChange={setBulkGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="No group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ASSIGN_NONE_VALUE}>No Group</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={String(group.id)}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Contacts JSON</Label>
              <Textarea
                rows={14}
                value={bulkJson}
                onChange={(event) => setBulkJson(event.target.value)}
                className="font-mono text-xs"
                placeholder={BULK_SAMPLE_PLACEHOLDER}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkImport} disabled={bulkImportMutation.isPending}>
              Import Contacts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(groupContactsTarget)} onOpenChange={(open) => !open && setGroupContactsTarget(null)}>
        <DialogContent className="w-[min(96vw,1100px)] max-w-none">
          <DialogHeader>
            <DialogTitle>{groupContactsTarget?.name || "Group Contacts"}</DialogTitle>
            <DialogDescription>Contacts directly assigned to this group.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="h-9 pl-8"
                placeholder="Search inside group"
                value={groupContactsSearch}
                onChange={(event) => {
                  setGroupContactsSearch(event.target.value);
                  setGroupContactsPage(0);
                }}
              />
            </div>
          </div>

          <div className="max-h-[55vh] overflow-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Phone</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Favorite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {groupContactsQuery.isLoading ? (
                  Array.from({ length: 8 }).map((_, rowIndex) => (
                    <tr key={rowIndex}>
                      {Array.from({ length: 4 }).map((__, cellIndex) => (
                        <td key={cellIndex} className="px-3 py-2">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : groupContactsQuery.isError ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-10 text-center text-sm text-destructive">
                      {getApiErrorMessage(groupContactsQuery.error, "Failed to load group contacts")}
                    </td>
                  </tr>
                ) : groupContacts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-10 text-center text-sm text-muted-foreground">
                      No contacts found in this group.
                    </td>
                  </tr>
                ) : (
                  groupContacts.map((contact) => (
                    <tr key={contact.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-3 py-2 text-xs font-medium text-foreground">{toFullName(contact)}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{contact.email || "—"}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {contact.countryCode || ""} {contact.phone || "—"}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="text-[10px]">
                          {contact.isFavorite ? "Favorite" : "No"}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {groupContactsTotal === 0
                ? "0 results"
                : `${groupContactsPage * GROUP_CONTACTS_PAGE_SIZE + 1}–${Math.min((groupContactsPage + 1) * GROUP_CONTACTS_PAGE_SIZE, groupContactsTotal)} of ${groupContactsTotal}`}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={groupContactsPage === 0}
                onClick={() => setGroupContactsPage((prev) => prev - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={groupContactsPage >= groupContactsTotalPages - 1}
                onClick={() => setGroupContactsPage((prev) => prev + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}
