import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Ban,
  BarChart3,
  CalendarClock,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Eye,
  FileText,
  Filter,
  MessageSquare,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import CampaignStatusBadge from "@/components/campaigns/CampaignStatusBadge";
import { getApiErrorMessage, getApiSuccessMessage } from "@/lib/utils/api-response";
import {
  cancelCampaign,
  deleteCampaign,
  executeCampaign,
  getCampaignAnalytics,
  getCampaignMessages,
  listCampaigns,
  pauseCampaign,
  resumeCampaign,
  scheduleCampaign,
} from "@/services/campaign.service";
import { listTemplates } from "@/services/template.service";
import type {
  Campaign,
  CampaignAnalytics,
  CampaignMessageLog,
  CampaignMessageStatus,
  CampaignStatus,
} from "@/types/campaign.types";
import { CAMPAIGN_MESSAGE_STATUSES, CAMPAIGN_STATUSES } from "@/types/campaign.types";

const PAGE_SIZES = [10, 20, 50];
const MESSAGE_PAGE_SIZE = 20;
const EMPTY_CAMPAIGNS: Campaign[] = [];

type SortField = "name" | "status" | "scheduledAt" | "createdAt";
type SortDir = "asc" | "desc";

const toDateTimeLocal = (iso?: string | null): string => {
  if (!iso) return "";
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";
  const tzOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
};

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

const numberFormatter = new Intl.NumberFormat("en-IN");

const toSafeNumber = (value?: string | number | null): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const toRatioPercent = (part: number, total: number): number => {
  if (total <= 0) return 0;
  const ratio = (part / total) * 100;
  if (!Number.isFinite(ratio)) return 0;
  return Math.max(0, Math.min(100, ratio));
};

const toBoundedPercent = (value?: string | number | null, fallback = 0): number => {
  if (value === undefined || value === null || value === "") {
    return Math.max(0, Math.min(100, fallback));
  }

  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return Math.max(0, Math.min(100, fallback));
  return Math.max(0, Math.min(100, parsed));
};

const formatCount = (value: number): string => numberFormatter.format(Math.max(0, Math.round(value)));

const formatPercent = (value: number): string => {
  const bounded = Math.max(0, Math.min(100, value));
  const rounded = Number.isInteger(bounded) ? bounded.toFixed(0) : bounded.toFixed(1);
  return `${rounded}%`;
};

function MessageStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-zinc-100 text-zinc-700 border-zinc-200",
    sent: "bg-blue-100 text-blue-700 border-blue-200",
    delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
    read: "bg-green-100 text-green-700 border-green-200",
    failed: "bg-rose-100 text-rose-700 border-rose-200",
  };

  return (
    <Badge variant="outline" className={`text-xs font-medium capitalize ${map[status] || map.pending}`}>
      {status}
    </Badge>
  );
}

function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
}) {
  if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />;
  return sortDir === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5 text-primary" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-primary" />
  );
}

export default function CampaignsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "ALL">("ALL");

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<Campaign | null>(null);
  const [scheduleAt, setScheduleAt] = useState("");
  const [analyticsTarget, setAnalyticsTarget] = useState<Campaign | null>(null);
  const [messagesTarget, setMessagesTarget] = useState<Campaign | null>(null);
  const [messageStatusFilter, setMessageStatusFilter] = useState<CampaignMessageStatus | "ALL">("ALL");
  const [messagesPage, setMessagesPage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      limit: pageSize,
      ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }),
    [page, pageSize, statusFilter, debouncedSearch]
  );

  const campaignsQuery = useQuery({
    queryKey: ["campaigns", queryParams],
    queryFn: () => listCampaigns(queryParams),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const analyticsQuery = useQuery({
    queryKey: ["campaign-analytics", analyticsTarget?.id],
    enabled: Boolean(analyticsTarget?.id),
    queryFn: async () => {
      if (!analyticsTarget?.id) throw new Error("Campaign id is missing");
      const res = await getCampaignAnalytics(analyticsTarget.id);
      return res.data.analytics as CampaignAnalytics;
    },
    staleTime: 30 * 1000,
  });

  const messagesQuery = useQuery({
    queryKey: ["campaign-messages", messagesTarget?.id, messageStatusFilter, messagesPage],
    enabled: Boolean(messagesTarget?.id),
    queryFn: async () => {
      if (!messagesTarget?.id) throw new Error("Campaign id is missing");
      return getCampaignMessages(messagesTarget.id, {
        page: messagesPage + 1,
        limit: MESSAGE_PAGE_SIZE,
        ...(messageStatusFilter !== "ALL" ? { status: messageStatusFilter } : {}),
      });
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
  const templatesLookupQuery = useQuery({
    queryKey: ["campaigns-template-lookup"],
    queryFn: () => listTemplates({ limit: 300, offset: 0 }),
    staleTime: 5 * 60 * 1000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    queryClient.invalidateQueries({ queryKey: ["campaign-analytics"] });
    queryClient.invalidateQueries({ queryKey: ["campaign-messages"] });
    queryClient.invalidateQueries({ queryKey: ["campaigns-template-lookup"] });
  };

  const executeMutation = useMutation({
    mutationFn: (id: string) => executeCampaign(id),
    onMutate: () => ({ toastId: toast.loading("Executing campaign...") }),
    onSuccess: (res, _id, ctx) => {
      toast.success(getApiSuccessMessage(res, "Campaign execution started"), { id: ctx?.toastId });
      refresh();
    },
    onError: (error, _id, ctx) => {
      toast.error(getApiErrorMessage(error, "Failed to execute campaign"), { id: ctx?.toastId });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => pauseCampaign(id),
    onMutate: () => ({ toastId: toast.loading("Pausing campaign...") }),
    onSuccess: (res, _id, ctx) => {
      toast.success(getApiSuccessMessage(res, "Campaign paused"), { id: ctx?.toastId });
      refresh();
    },
    onError: (error, _id, ctx) => {
      toast.error(getApiErrorMessage(error, "Failed to pause campaign"), { id: ctx?.toastId });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: (id: string) => resumeCampaign(id),
    onMutate: () => ({ toastId: toast.loading("Resuming campaign...") }),
    onSuccess: (res, _id, ctx) => {
      toast.success(getApiSuccessMessage(res, "Campaign resumed"), { id: ctx?.toastId });
      refresh();
    },
    onError: (error, _id, ctx) => {
      toast.error(getApiErrorMessage(error, "Failed to resume campaign"), { id: ctx?.toastId });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelCampaign(id),
    onMutate: () => ({ toastId: toast.loading("Cancelling campaign...") }),
    onSuccess: (res, _id, ctx) => {
      toast.success(getApiSuccessMessage(res, "Campaign cancelled"), { id: ctx?.toastId });
      refresh();
    },
    onError: (error, _id, ctx) => {
      toast.error(getApiErrorMessage(error, "Failed to cancel campaign"), { id: ctx?.toastId });
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: string }) =>
      scheduleCampaign(id, { scheduledAt }),
    onMutate: () => ({ toastId: toast.loading("Scheduling campaign...") }),
    onSuccess: (res, _vars, ctx) => {
      toast.success(getApiSuccessMessage(res, "Campaign scheduled"), { id: ctx?.toastId });
      setScheduleTarget(null);
      setScheduleAt("");
      refresh();
    },
    onError: (error, _vars, ctx) => {
      toast.error(getApiErrorMessage(error, "Failed to schedule campaign"), { id: ctx?.toastId });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCampaign(id),
    onMutate: () => ({ toastId: toast.loading("Deleting campaign...") }),
    onSuccess: (res, _id, ctx) => {
      toast.success(getApiSuccessMessage(res, "Campaign deleted"), { id: ctx?.toastId });
      setDeleteTarget(null);
      refresh();
    },
    onError: (error, _id, ctx) => {
      toast.error(getApiErrorMessage(error, "Failed to delete campaign"), { id: ctx?.toastId });
    },
  });

  const campaigns = campaignsQuery.data?.data ?? EMPTY_CAMPAIGNS;
  const templateNameLookup = useMemo(() => {
    const map = new Map<string, string>();
    const templates = templatesLookupQuery.data?.data || [];

    templates.forEach((template) => {
      const name = (template.name || "").trim();
      if (!name) return;

      const uuid = String(template.uuid || "").trim();
      if (uuid) map.set(uuid, name);

      const id = String(template.id || "").trim();
      if (id) map.set(id, name);
    });

    return map;
  }, [templatesLookupQuery.data]);

  const getTemplateDisplayName = (campaign: Campaign): string => {
    const directName = campaign.templateName?.trim();
    if (directName) return directName;

    const templateId = campaign.templateId?.trim();
    if (templateId) {
      const resolved = templateNameLookup.get(templateId);
      if (resolved?.trim()) return resolved.trim();
    }

    return "—";
  };

  const total = campaignsQuery.data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters = statusFilter !== "ALL" || debouncedSearch;
  const isInitialLoading = campaignsQuery.isPending && !campaignsQuery.data;

  useEffect(() => {
    const nextPage = page + 1;
    if (!campaignsQuery.data) return;
    if ((nextPage + 1 - 1) * pageSize >= total) return;

    const nextParams = { ...queryParams, page: nextPage + 1 };
    queryClient.prefetchQuery({
      queryKey: ["campaigns", nextParams],
      queryFn: () => listCampaigns(nextParams),
      staleTime: 60 * 1000,
    });
  }, [campaignsQuery.data, page, pageSize, queryClient, queryParams, total]);

  useEffect(() => {
    if (!campaignsQuery.error) return;
    toast.error(getApiErrorMessage(campaignsQuery.error, "Failed to load campaigns"));
  }, [campaignsQuery.error, campaignsQuery.errorUpdatedAt]);

  const filteredCampaigns = useMemo(() => {
    if (!debouncedSearch) return campaigns;

    const needle = debouncedSearch.toLowerCase();
    return campaigns.filter((item) =>
      [item.name, item.description, getTemplateDisplayName(item), item.groupName]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle))
    );
  }, [campaigns, debouncedSearch, templateNameLookup]);

  const sortedCampaigns = useMemo(() => {
    const list = [...filteredCampaigns];
    const dir = sortDir === "asc" ? 1 : -1;

    list.sort((a, b) => {
      const getValue = (item: Campaign) => {
        if (sortField === "scheduledAt") {
          const ts = item.scheduledAt ? new Date(item.scheduledAt).getTime() : 0;
          return Number.isFinite(ts) ? ts : 0;
        }
        if (sortField === "createdAt") {
          const ts = item.createdAt ? new Date(item.createdAt).getTime() : 0;
          return Number.isFinite(ts) ? ts : 0;
        }
        return String(item[sortField] || "").toLowerCase();
      };

      const av = getValue(a);
      const bv = getValue(b);
      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * dir;
      }
      return String(av).localeCompare(String(bv)) * dir;
    });

    return list;
  }, [filteredCampaigns, sortDir, sortField]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const handleScheduleOpen = (campaign: Campaign) => {
    setScheduleTarget(campaign);
    setScheduleAt(toDateTimeLocal(campaign.scheduledAt));
  };

  const handleScheduleSubmit = () => {
    if (!scheduleTarget?.id) return;
    if (!scheduleAt.trim()) {
      toast.error("Please select a schedule date/time.");
      return;
    }

    const iso = new Date(scheduleAt).toISOString();
    if (!Number.isFinite(new Date(iso).getTime())) {
      toast.error("Invalid schedule date/time.");
      return;
    }

    scheduleMutation.mutate({
      id: scheduleTarget.id,
      scheduledAt: iso,
    });
  };

  const handleOpenMessages = (campaign: Campaign) => {
    setMessagesTarget(campaign);
    setMessageStatusFilter("ALL");
    setMessagesPage(0);
  };

  const currentMessages = messagesQuery.data?.data || [];
  const currentMessagesTotal = messagesQuery.data?.total || 0;
  const currentMessagesTotalPages = Math.max(1, messagesQuery.data?.totalPages || 1);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
        <p className="text-sm text-muted-foreground">Manage campaign lifecycle, analytics and per-recipient logs</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          <div className="relative min-w-[220px] max-w-xs flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              className="h-9 pl-8"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as CampaignStatus | "ALL");
              setPage(0);
            }}
          >
            <SelectTrigger className="h-9 w-[170px]">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              {CAMPAIGN_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 text-xs"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                setPage(0);
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
            onClick={refresh}
            disabled={campaignsQuery.isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${campaignsQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" className="h-9 gap-1.5" onClick={() => navigate("/campaigns/create")}>
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        </div>
      </div>

      {!isInitialLoading && (
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">{debouncedSearch ? sortedCampaigns.length : total}</span>{" "}
            {debouncedSearch ? "campaigns on this page" : total === 1 ? "campaign" : "campaigns"}
            {hasFilters && " (filtered)"}
          </span>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="h-full overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 border-b border-border bg-muted/80 backdrop-blur">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  <button className="flex items-center gap-1.5 transition-colors hover:text-foreground" onClick={() => handleSort("name")}>
                    Name <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Template</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Group</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  <button className="flex items-center gap-1.5 transition-colors hover:text-foreground" onClick={() => handleSort("status")}>
                    Status <SortIcon field="status" sortField={sortField} sortDir={sortDir} />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  <button className="flex items-center gap-1.5 transition-colors hover:text-foreground" onClick={() => handleSort("scheduledAt")}>
                    Scheduled <SortIcon field="scheduledAt" sortField={sortField} sortDir={sortDir} />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  <button className="flex items-center gap-1.5 transition-colors hover:text-foreground" onClick={() => handleSort("createdAt")}>
                    Created <SortIcon field="createdAt" sortField={sortField} sortDir={sortDir} />
                  </button>
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {isInitialLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : campaignsQuery.isError && sortedCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <FileText className="h-10 w-10 opacity-30" />
                      <div>
                        <p className="text-sm font-medium">Failed to load campaigns</p>
                        <p className="mt-0.5 text-xs">Please try again</p>
                      </div>
                      <Button size="sm" variant="outline" className="mt-1 gap-1.5" onClick={() => campaignsQuery.refetch()}>
                        <RefreshCw className="h-4 w-4" /> Retry
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : sortedCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <FileText className="h-10 w-10 opacity-30" />
                      <div>
                        <p className="text-sm font-medium">No campaigns found</p>
                        <p className="mt-0.5 text-xs">
                          {hasFilters ? "Try clearing your filters" : "Create your first campaign to get started"}
                        </p>
                      </div>
                      {!hasFilters && (
                        <Button size="sm" className="mt-1 gap-1.5" onClick={() => navigate("/campaigns/create")}>
                          <Plus className="h-4 w-4" /> New Campaign
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                sortedCampaigns.map((campaign, index) => (
                  <CampaignRow
                    key={campaign.id || `${campaign.name}-${index}`}
                    campaign={campaign}
                    templateDisplayName={getTemplateDisplayName(campaign)}
                    onEdit={() => navigate(`/campaigns/${campaign.id}/update`)}
                    onExecute={() => executeMutation.mutate(campaign.id)}
                    onPause={() => pauseMutation.mutate(campaign.id)}
                    onResume={() => resumeMutation.mutate(campaign.id)}
                    onCancel={() => cancelMutation.mutate(campaign.id)}
                    onSchedule={() => handleScheduleOpen(campaign)}
                    onAnalytics={() => setAnalyticsTarget(campaign)}
                    onMessages={() => handleOpenMessages(campaign)}
                    onDelete={() => setDeleteTarget(campaign)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!isInitialLoading && total > 0 && !debouncedSearch && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Rows per page:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPage(0);
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
              {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} of {total}
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage((prev) => prev - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((prev) => prev + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{deleteTarget?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget?.id && deleteMutation.mutate(deleteTarget.id)}
            >
              Delete Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(scheduleTarget)} onOpenChange={(open) => !open && setScheduleTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Campaign</DialogTitle>
            <DialogDescription>
              Pick a future date/time for <span className="font-semibold">{scheduleTarget?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="schedule-campaign-at">Scheduled At</Label>
            <Input
              id="schedule-campaign-at"
              type="datetime-local"
              value={scheduleAt}
              onChange={(event) => setScheduleAt(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleSubmit} disabled={scheduleMutation.isPending || !scheduleAt.trim()}>
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(analyticsTarget)} onOpenChange={(open) => !open && setAnalyticsTarget(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{analyticsTarget?.name || "Campaign Analytics"}</DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-2">
              <span>Delivery, read and failure metrics for this campaign.</span>
              {analyticsTarget?.status ? <CampaignStatusBadge status={analyticsTarget.status} /> : null}
            </DialogDescription>
          </DialogHeader>

          {analyticsQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-44 rounded-xl" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-28 rounded-xl" />
                ))}
              </div>
            </div>
          ) : analyticsQuery.isError ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              {getApiErrorMessage(analyticsQuery.error, "Failed to load analytics")}
            </div>
          ) : analyticsQuery.data ? (
            <CampaignAnalyticsOverview analytics={analyticsQuery.data} />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(messagesTarget)} onOpenChange={(open) => !open && setMessagesTarget(null)}>
        <DialogContent className="w-[min(96vw,1100px)] max-w-none">
          <DialogHeader>
            <DialogTitle>{messagesTarget?.name || "Campaign Messages"}</DialogTitle>
            <DialogDescription>Per-recipient message logs for this campaign.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={messageStatusFilter}
              onValueChange={(value) => {
                setMessageStatusFilter(value as CampaignMessageStatus | "ALL");
                setMessagesPage(0);
              }}
            >
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Message status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                {CAMPAIGN_MESSAGE_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="max-h-[55vh] overflow-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Contact</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Phone</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Message / Error</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {messagesQuery.isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="px-3 py-2">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : messagesQuery.isError ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center text-sm text-destructive">
                      {getApiErrorMessage(messagesQuery.error, "Failed to load campaign messages")}
                    </td>
                  </tr>
                ) : currentMessages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center text-sm text-muted-foreground">
                      No message logs found.
                    </td>
                  </tr>
                ) : (
                  currentMessages.map((message) => <MessageRow key={message.id} row={message} />)
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {currentMessagesTotal === 0
                ? "0 results"
                : `${messagesPage * MESSAGE_PAGE_SIZE + 1}–${Math.min((messagesPage + 1) * MESSAGE_PAGE_SIZE, currentMessagesTotal)} of ${currentMessagesTotal}`}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={messagesPage === 0}
                onClick={() => setMessagesPage((prev) => prev - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={messagesPage >= currentMessagesTotalPages - 1}
                onClick={() => setMessagesPage((prev) => prev + 1)}
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

type AnalyticsTone = "sky" | "blue" | "emerald" | "green" | "amber" | "rose";

const ANALYTICS_TONES: Record<AnalyticsTone, { card: string; icon: string; bar: string }> = {
  sky: {
    card: "border-sky-200/70 bg-gradient-to-br from-sky-50 via-white to-indigo-50/70",
    icon: "border-sky-200 bg-sky-100 text-sky-700",
    bar: "from-sky-500 to-indigo-500",
  },
  blue: {
    card: "border-blue-200/70 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/60",
    icon: "border-blue-200 bg-blue-100 text-blue-700",
    bar: "from-blue-500 to-indigo-500",
  },
  emerald: {
    card: "border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 via-white to-green-50/60",
    icon: "border-emerald-200 bg-emerald-100 text-emerald-700",
    bar: "from-emerald-500 to-green-500",
  },
  green: {
    card: "border-green-200/70 bg-gradient-to-br from-green-50/80 via-white to-lime-50/60",
    icon: "border-green-200 bg-green-100 text-green-700",
    bar: "from-green-500 to-lime-500",
  },
  amber: {
    card: "border-amber-200/70 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/60",
    icon: "border-amber-200 bg-amber-100 text-amber-700",
    bar: "from-amber-500 to-orange-500",
  },
  rose: {
    card: "border-rose-200/70 bg-gradient-to-br from-rose-50/80 via-white to-pink-50/60",
    icon: "border-rose-200 bg-rose-100 text-rose-700",
    bar: "from-rose-500 to-pink-500",
  },
};

interface CampaignAnalyticsOverviewProps {
  analytics: CampaignAnalytics;
}

function CampaignAnalyticsOverview({ analytics }: CampaignAnalyticsOverviewProps) {
  const totalRecipients = toSafeNumber(analytics.totalRecipients);
  const sentCount = toSafeNumber(analytics.sentCount);
  const deliveredCount = toSafeNumber(analytics.deliveredCount);
  const readCount = toSafeNumber(analytics.readCount);
  const failedCount = toSafeNumber(analytics.failedCount);
  const pendingCount = toSafeNumber(analytics.pendingCount);

  const deliveryRate = toBoundedPercent(analytics.deliveryRate, toRatioPercent(deliveredCount, totalRecipients));
  const readRate = toBoundedPercent(analytics.readRate, toRatioPercent(readCount, totalRecipients));
  const failureRate = toBoundedPercent(analytics.failureRate, toRatioPercent(failedCount, totalRecipients));
  const processedCount = Math.max(0, totalRecipients - pendingCount);
  const processedRate = toRatioPercent(processedCount, totalRecipients);

  const deliveryDistribution = [
    { label: "Delivered", value: deliveredCount, dotClass: "bg-emerald-500" },
    { label: "Read", value: readCount, dotClass: "bg-green-500" },
    { label: "Failed", value: failedCount, dotClass: "bg-rose-500" },
    { label: "Pending", value: pendingCount, dotClass: "bg-amber-500" },
  ];

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-xl border border-sky-200/70 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-4 sm:p-5">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-8 h-36 w-36 rounded-full bg-indigo-200/30 blur-3xl" />

        <div className="relative grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-3">
            <Badge variant="secondary" className="w-fit border border-sky-200/80 bg-sky-100/70 text-sky-700">
              <Activity className="mr-1 h-3.5 w-3.5" />
              Live Performance
            </Badge>

            <div className="space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Campaign Audience</p>
              <p className="text-3xl font-semibold tracking-tight text-foreground">{formatCount(totalRecipients)}</p>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Sent {formatCount(sentCount)} • Delivered {formatCount(deliveredCount)} • Read {formatCount(readCount)}
              </p>
            </div>

            <div className="space-y-1.5 rounded-lg border border-white/60 bg-background/80 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">Execution Progress</span>
                <span className="font-semibold text-foreground">{formatPercent(processedRate)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-200/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all"
                  style={{ width: `${processedRate}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {formatCount(processedCount)} processed • {formatCount(pendingCount)} pending
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {deliveryDistribution.map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-2 py-1 text-[11px] text-muted-foreground"
                >
                  <span className={`h-2 w-2 rounded-full ${item.dotClass}`} />
                  {item.label}: {formatCount(item.value)}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-background/85 p-4 shadow-sm backdrop-blur">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Performance Rates</p>
            <div className="mt-3 space-y-3">
              <AnalyticsRateRow
                label="Delivery Rate"
                value={deliveryRate}
                helper={`${formatCount(deliveredCount)} contacts delivered`}
                fillClassName="from-emerald-500 to-green-500"
              />
              <AnalyticsRateRow
                label="Read Rate"
                value={readRate}
                helper={`${formatCount(readCount)} contacts read the message`}
                fillClassName="from-blue-500 to-indigo-500"
              />
              <AnalyticsRateRow
                label="Failure Rate"
                value={failureRate}
                helper={`${formatCount(failedCount)} contacts failed`}
                fillClassName="from-rose-500 to-pink-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <AnalyticsStatCard
          label="Recipients"
          value={totalRecipients}
          hint="Total campaign audience"
          tone="sky"
          progress={100}
          icon={<Users className="h-4 w-4" />}
        />
        <AnalyticsStatCard
          label="Sent"
          value={sentCount}
          hint={`${formatPercent(toRatioPercent(sentCount, totalRecipients))} of recipients`}
          tone="blue"
          progress={toRatioPercent(sentCount, totalRecipients)}
          icon={<Send className="h-4 w-4" />}
        />
        <AnalyticsStatCard
          label="Delivered"
          value={deliveredCount}
          hint={`${formatPercent(toRatioPercent(deliveredCount, totalRecipients))} delivery coverage`}
          tone="emerald"
          progress={toRatioPercent(deliveredCount, totalRecipients)}
          icon={<CheckCheck className="h-4 w-4" />}
        />
        <AnalyticsStatCard
          label="Read"
          value={readCount}
          hint={`${formatPercent(toRatioPercent(readCount, totalRecipients))} read coverage`}
          tone="green"
          progress={toRatioPercent(readCount, totalRecipients)}
          icon={<Eye className="h-4 w-4" />}
        />
        <AnalyticsStatCard
          label="Failed"
          value={failedCount}
          hint={`${formatPercent(toRatioPercent(failedCount, totalRecipients))} failed attempts`}
          tone="rose"
          progress={toRatioPercent(failedCount, totalRecipients)}
          icon={<CircleAlert className="h-4 w-4" />}
        />
        <AnalyticsStatCard
          label="Pending"
          value={pendingCount}
          hint={`${formatPercent(toRatioPercent(pendingCount, totalRecipients))} still pending`}
          tone="amber"
          progress={toRatioPercent(pendingCount, totalRecipients)}
          icon={<Clock3 className="h-4 w-4" />}
        />
      </div>
    </div>
  );
}

interface AnalyticsRateRowProps {
  label: string;
  value: number;
  helper: string;
  fillClassName: string;
}

function AnalyticsRateRow({ label, value, helper, fillClassName }: AnalyticsRateRowProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-semibold text-foreground">{formatPercent(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-200/70">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all ${fillClassName}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">{helper}</p>
    </div>
  );
}

interface AnalyticsStatCardProps {
  label: string;
  value: number;
  hint: string;
  tone: AnalyticsTone;
  progress: number;
  icon: ReactNode;
}

function AnalyticsStatCard({ label, value, hint, tone, progress, icon }: AnalyticsStatCardProps) {
  const styles = ANALYTICS_TONES[tone];
  const boundedProgress = Math.max(0, Math.min(100, progress));
  const progressWidth = boundedProgress > 0 ? Math.max(4, boundedProgress) : 0;

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${styles.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold leading-none text-foreground">{formatCount(value)}</p>
          <p className="mt-2 truncate text-[11px] text-muted-foreground">{hint}</p>
        </div>
        <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${styles.icon}`}>
          {icon}
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-200/70">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all ${styles.bar}`}
          style={{ width: `${progressWidth}%` }}
        />
      </div>
    </div>
  );
}

interface CampaignRowProps {
  campaign: Campaign;
  templateDisplayName: string;
  onEdit: () => void;
  onExecute: () => void;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onSchedule: () => void;
  onAnalytics: () => void;
  onMessages: () => void;
  onDelete: () => void;
}

function CampaignRow({
  campaign,
  templateDisplayName,
  onEdit,
  onExecute,
  onPause,
  onResume,
  onCancel,
  onSchedule,
  onAnalytics,
  onMessages,
  onDelete,
}: CampaignRowProps) {
  return (
    <tr className="group transition-colors hover:bg-muted/40">
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <p className="font-mono text-xs font-medium text-foreground">{campaign.name}</p>
          <span className="mt-0.5 text-[10px] text-muted-foreground">#{campaign.id}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-foreground">{templateDisplayName}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="text-xs text-foreground">{campaign.groupName || "—"}</span>
          {campaign.groupId ? (
            <span className="text-[10px] text-muted-foreground">ID: {campaign.groupId}</span>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3">
        <CampaignStatusBadge status={campaign.status} />
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{toDateTimeDisplay(campaign.scheduledAt)}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{toDateTimeDisplay(campaign.createdAt)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAnalytics}>
                <BarChart3 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Analytics</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
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
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExecute}>
                <Play className="mr-2 h-4 w-4" /> Execute
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onPause}>
                <Pause className="mr-2 h-4 w-4" /> Pause
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onResume}>
                <RotateCcw className="mr-2 h-4 w-4" /> Resume
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCancel}>
                <Ban className="mr-2 h-4 w-4" /> Cancel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSchedule}>
                <CalendarClock className="mr-2 h-4 w-4" /> Schedule
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onAnalytics}>
                <BarChart3 className="mr-2 h-4 w-4" /> Analytics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onMessages}>
                <MessageSquare className="mr-2 h-4 w-4" /> Messages
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}

function MessageRow({ row }: { row: CampaignMessageLog }) {
  return (
    <tr className="transition-colors hover:bg-muted/40">
      <td className="px-3 py-2">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-foreground">{row.contactName || "Unknown contact"}</span>
          {row.contactId ? <span className="text-[10px] text-muted-foreground">ID: {row.contactId}</span> : null}
        </div>
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">{row.phoneNumber || "—"}</td>
      <td className="px-3 py-2">
        <MessageStatusBadge status={row.status} />
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-col">
          {row.messageId ? <span className="text-xs text-foreground">{row.messageId}</span> : null}
          {row.errorMessage ? (
            <span className="text-[10px] text-destructive">{row.errorMessage}</span>
          ) : (
            <span className="text-[10px] text-muted-foreground">No error</span>
          )}
        </div>
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">{toDateTimeDisplay(row.updatedAt)}</td>
    </tr>
  );
}
