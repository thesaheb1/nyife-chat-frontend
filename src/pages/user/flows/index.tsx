import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Pencil,
  MoreHorizontal,
  UploadCloud,
  Ban,
  Filter,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
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

import {
  cloneFlow,
  deleteFlow,
  listFlows,
  publishFlow,
  retireFlow,
  syncFlowStatuses,
  syncFlowStatus,
} from "@/services/flow.service";
import { getApiErrorMessage, getApiSuccessMessage } from "@/lib/utils/api-response";
import { FLOW_CATEGORIES, type FlowCategory, type FlowStatus, type FlowTemplate } from "@/types/flow.types";

const PAGE_SIZES = [10, 20, 50];

type SortField = "name" | "category" | "status" | "createdAt";
type SortDir = "asc" | "desc";

export default function FlowsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FlowStatus | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<FlowCategory | "ALL">("ALL");

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [cloneTarget, setCloneTarget] = useState<FlowTemplate | null>(null);
  const [cloneName, setCloneName] = useState("");
  const [cloneKey, setCloneKey] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<FlowTemplate | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, statusFilter, categoryFilter, pageSize]);

  const queryParams = useMemo(
    () => ({
      limit: pageSize,
      offset: page * pageSize,
      ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
      ...(categoryFilter !== "ALL" ? { category: categoryFilter } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }),
    [page, pageSize, statusFilter, categoryFilter, debouncedSearch]
  );

  const query = useQuery({
    queryKey: ["flows", queryParams],
    queryFn: () => listFlows(queryParams),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["flows"] });
  };

  const publishMutation = useMutation({
    mutationFn: (id: string) => publishFlow(id),
    onMutate: () => ({ toastId: toast.loading("Publishing flow...") }),
    onSuccess: (res, _id, ctx) => {
      toast.success(getApiSuccessMessage(res, "Flow published successfully"), { id: ctx?.toastId });
      refresh();
    },
    onError: (err, _id, ctx) => toast.error(getApiErrorMessage(err, "Publish failed"), { id: ctx?.toastId }),
  });

  const retireMutation = useMutation({
    mutationFn: (id: string) => retireFlow(id),
    onMutate: () => ({ toastId: toast.loading("Retiring flow...") }),
    onSuccess: (res, _id, ctx) => {
      toast.success(getApiSuccessMessage(res, "Flow retired successfully"), { id: ctx?.toastId });
      refresh();
    },
    onError: (err, _id, ctx) => toast.error(getApiErrorMessage(err, "Retire failed"), { id: ctx?.toastId }),
  });

  const syncOneMutation = useMutation({
    mutationFn: (id: string) => syncFlowStatus(id),
    onMutate: () => ({ toastId: toast.loading("Syncing flow status...") }),
    onSuccess: (res, _id, ctx) => {
      toast.success(getApiSuccessMessage(res, "Flow status synced"), { id: ctx?.toastId });
      refresh();
    },
    onError: (err, _id, ctx) => toast.error(getApiErrorMessage(err, "Sync failed"), { id: ctx?.toastId }),
  });

  const syncAllMutation = useMutation({
    mutationFn: () => syncFlowStatuses(100, 0, false),
    onMutate: () => ({ toastId: toast.loading("Syncing all flow statuses...") }),
    onSuccess: (res, _none, ctx) => {
      toast.success(getApiSuccessMessage(res, "Flow statuses synced"), { id: ctx?.toastId });
      refresh();
    },
    onError: (err, _none, ctx) => toast.error(getApiErrorMessage(err, "Sync failed"), { id: ctx?.toastId }),
  });

  const cloneMutation = useMutation({
    mutationFn: ({ id, name, template_key }: { id: string; name: string; template_key: string }) =>
      cloneFlow(id, { name, template_key }),
    onMutate: ({ name }) => ({ toastId: toast.loading(`Cloning ${name}...`) }),
    onSuccess: (res, _vars, ctx) => {
      toast.success(getApiSuccessMessage(res, "Flow cloned"), { id: ctx?.toastId });
      setCloneTarget(null);
      setCloneName("");
      setCloneKey("");
      refresh();
    },
    onError: (err, _vars, ctx) => toast.error(getApiErrorMessage(err, "Clone failed"), { id: ctx?.toastId }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFlow(id),
    onMutate: () => ({ toastId: toast.loading("Deleting flow...") }),
    onSuccess: (res, _id, ctx) => {
      toast.success(getApiSuccessMessage(res, "Flow deleted"), { id: ctx?.toastId });
      setDeleteTarget(null);
      refresh();
    },
    onError: (err, _id, ctx) => toast.error(getApiErrorMessage(err, "Delete failed"), { id: ctx?.toastId }),
  });

  const flows = query.data?.data || [];
  const total = query.data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters = statusFilter !== "ALL" || categoryFilter !== "ALL" || debouncedSearch;
  const isInitialLoading = query.isPending && !query.data;

  useEffect(() => {
    const nextPage = page + 1;
    if (!query.data) return;
    if (nextPage * pageSize >= total) return;

    const nextParams = { ...queryParams, offset: nextPage * pageSize };
    queryClient.prefetchQuery({
      queryKey: ["flows", nextParams],
      queryFn: () => listFlows(nextParams),
      staleTime: 60 * 1000,
    });
  }, [page, pageSize, query.data, queryClient, queryParams, total]);

  useEffect(() => {
    if (!query.error) return;
    toast.error(getApiErrorMessage(query.error, "Failed to load flows"));
  }, [query.error, query.errorUpdatedAt]);

  useEffect(() => {
    if (isInitialLoading) return;
    const maxPage = Math.max(totalPages - 1, 0);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [isInitialLoading, page, totalPages]);

  const sortedFlows = useMemo(() => {
    const list = [...flows];
    const dir = sortDir === "asc" ? 1 : -1;

    list.sort((a, b) => {
      const getValue = (item: FlowTemplate) => {
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
  }, [flows, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />;
    return sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />;
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Flows</h1>
        <p className="text-sm text-muted-foreground">Manage your WhatsApp Flow templates</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 min-w-0 flex-wrap gap-2">
          <div className="relative min-w-[220px] max-w-xs flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search flows..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FlowStatus | "ALL")}>
            <SelectTrigger className="h-9 w-[140px]">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="DEPRECATED">Deprecated</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
              <SelectItem value="UNKNOWN">Unknown</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as FlowCategory | "ALL")}>
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {FLOW_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.replace(/_/g, " ")}
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
                setCategoryFilter("ALL");
              }}
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5"
                onClick={() => syncAllMutation.mutate()}
                disabled={syncAllMutation.isPending}
              >
                <RefreshCw className={`h-4 w-4 ${syncAllMutation.isPending ? "animate-spin" : ""}`} />
                {syncAllMutation.isPending ? "Syncing..." : "Sync"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Sync flow statuses from Meta</TooltipContent>
          </Tooltip>

          <Button size="sm" className="h-9 gap-1.5" onClick={() => navigate("/flows/create")}> 
            <Plus className="h-4 w-4" />
            New Flow
          </Button>
        </div>
      </div>

      {!isInitialLoading && (
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">{total}</span> {total === 1 ? "flow" : "flows"}
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
                    Name <SortIcon field="name" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  <button className="flex items-center gap-1.5 transition-colors hover:text-foreground" onClick={() => handleSort("category")}>
                    Category <SortIcon field="category" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Template Key</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  <button className="flex items-center gap-1.5 transition-colors hover:text-foreground" onClick={() => handleSort("status")}>
                    Status <SortIcon field="status" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  <button className="flex items-center gap-1.5 transition-colors hover:text-foreground" onClick={() => handleSort("createdAt")}>
                    Created <SortIcon field="createdAt" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {isInitialLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : query.isError && sortedFlows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <FileText className="h-10 w-10 opacity-30" />
                      <div>
                        <p className="text-sm font-medium">Failed to load flows</p>
                        <p className="mt-0.5 text-xs">Please try again</p>
                      </div>
                      <Button size="sm" variant="outline" className="mt-1 gap-1.5" onClick={() => query.refetch()}>
                        <RefreshCw className="h-4 w-4" /> Retry
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : sortedFlows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <FileText className="h-10 w-10 opacity-30" />
                      <div>
                        <p className="text-sm font-medium">No flows found</p>
                        <p className="mt-0.5 text-xs">
                          {hasFilters ? "Try clearing your filters" : "Create your first flow to get started"}
                        </p>
                      </div>
                      {!hasFilters && (
                        <Button size="sm" className="mt-1 gap-1.5" onClick={() => navigate("/flows/create")}>
                          <Plus className="h-4 w-4" /> New Flow
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                sortedFlows.map((flow) => (
                  <FlowRow
                    key={flow.id}
                    flow={flow}
                    onEdit={() => navigate(`/flows/${flow.id}/update`)}
                    onPublish={() => publishMutation.mutate(flow.id)}
                    onRetire={() => retireMutation.mutate(flow.id)}
                    onSync={() => syncOneMutation.mutate(flow.id)}
                    onClone={() => {
                      setCloneTarget(flow);
                      setCloneName(`${flow.name} Clone`);
                      setCloneKey(`${flow.template_key}_clone`);
                    }}
                    onDelete={() => setDeleteTarget(flow)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!isInitialLoading && total > 0 && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Rows per page:</span>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="h-7 w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((s) => (
                  <SelectItem key={s} value={String(s)} className="text-xs">
                    {s}
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
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={Boolean(cloneTarget)} onOpenChange={(open) => !open && setCloneTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clone Flow</DialogTitle>
            <DialogDescription>Create a copy of this flow with a new name and key.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={cloneName} onChange={(e) => setCloneName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Template Key</Label>
              <Input value={cloneKey} onChange={(e) => setCloneKey(e.target.value)} className="font-mono" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCloneTarget(null)}>Cancel</Button>
            <Button
              onClick={() => cloneTarget && cloneMutation.mutate({ id: cloneTarget.id, name: cloneName, template_key: cloneKey })}
              disabled={cloneMutation.isPending || !cloneName.trim() || !cloneKey.trim()}
            >
              Clone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Flow</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold font-mono">{deleteTarget?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              Delete Flow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface FlowRowProps {
  flow: FlowTemplate;
  onEdit: () => void;
  onPublish: () => void;
  onRetire: () => void;
  onSync: () => void;
  onClone: () => void;
  onDelete: () => void;
}

function FlowRow({
  flow,
  onEdit,
  onPublish,
  onRetire,
  onSync,
  onClone,
  onDelete,
}: FlowRowProps) {
  const categoryColors: Record<string, string> = {
    LEAD_GENERATION: "bg-violet-100 text-violet-700 border-violet-200",
    LEAD_QUALIFICATION: "bg-indigo-100 text-indigo-700 border-indigo-200",
    APPOINTMENT_BOOKING: "bg-blue-100 text-blue-700 border-blue-200",
    SLOT_BOOKING: "bg-sky-100 text-sky-700 border-sky-200",
    ORDER_PLACEMENT: "bg-amber-100 text-amber-700 border-amber-200",
    RE_ORDERING: "bg-orange-100 text-orange-700 border-orange-200",
    CUSTOMER_SUPPORT: "bg-emerald-100 text-emerald-700 border-emerald-200",
    TICKET_CREATION: "bg-teal-100 text-teal-700 border-teal-200",
    PAYMENTS: "bg-green-100 text-green-700 border-green-200",
    COLLECTIONS: "bg-lime-100 text-lime-700 border-lime-200",
    REGISTRATIONS: "bg-cyan-100 text-cyan-700 border-cyan-200",
    APPLICATIONS: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
    DELIVERY_UPDATES: "bg-rose-100 text-rose-700 border-rose-200",
    ADDRESS_CAPTURE: "bg-pink-100 text-pink-700 border-pink-200",
    FEEDBACK: "bg-yellow-100 text-yellow-700 border-yellow-200",
    SURVEYS: "bg-purple-100 text-purple-700 border-purple-200",
    OTHER: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <tr className="group transition-colors hover:bg-muted/40">
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <p className="font-mono text-xs font-medium text-foreground">{flow.name}</p>
          {flow.flowId && <span className="mt-0.5 text-[10px] text-muted-foreground">#{flow.flowId}</span>}
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge variant="outline" className={`text-xs font-medium ${categoryColors[flow.category] || ""}`}>
          {flow.category}
        </Badge>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{flow.template_key}</td>
      <td className="px-4 py-3">
        <FlowStatusBadge status={flow.status} />
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {flow.createdAt
          ? new Date(flow.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "-"}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onPublish}>
                <UploadCloud className="mr-2 h-4 w-4" /> Publish
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRetire}>
                <Ban className="mr-2 h-4 w-4" /> Retire
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSync}>
                <RefreshCw className="mr-2 h-4 w-4" /> Sync Status
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onClone}>
                <Copy className="mr-2 h-4 w-4" /> Clone
              </DropdownMenuItem>
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

function FlowStatusBadge({ status }: { status?: FlowStatus }) {
  const value = status || "UNKNOWN";
  const map: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
    PUBLISHED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    DEPRECATED: "bg-amber-100 text-amber-700 border-amber-200",
    ARCHIVED: "bg-rose-100 text-rose-700 border-rose-200",
    UNKNOWN: "bg-zinc-100 text-zinc-700 border-zinc-200",
  };

  return (
    <Badge variant="outline" className={`text-xs font-medium ${map[value] || map.UNKNOWN}`}>
      {value}
    </Badge>
  );
}
