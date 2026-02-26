import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Eye,
  Pencil,
  MoreHorizontal,
  CloudUpload,
  Filter,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import TemplateStatusBadge from "@/components/templates/TemplateStatusBadge";
import WhatsAppPreview from "@/components/templates/WhatsAppPreview";
import { getApiErrorMessage, getApiSuccessMessage } from "@/lib/utils/api-response";
import {
  listTemplates,
  deleteTemplate,
  syncTemplates,
  publishTemplate,
} from "@/services/template.service";
import type {
  Template,
  TemplateStatus,
  TemplateCategory,
} from "@/types/template.types";

const PAGE_SIZES = [10, 20, 50];

type SortField = "name" | "category" | "status" | "created_at";
type SortDir = "asc" | "desc";

export default function TemplatesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TemplateStatus | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | "ALL">("ALL");

  // Sort
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Preview dialog
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

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

  const templatesQuery = useQuery({
    queryKey: ["templates", queryParams],
    queryFn: () => listTemplates(queryParams),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const templates = templatesQuery.data?.data || [];
  const total = templatesQuery.data?.total || 0;
  const isInitialLoading = templatesQuery.isPending && !templatesQuery.data;

  useEffect(() => {
    const nextPage = page + 1;
    if (!templatesQuery.data) return;
    if (nextPage * pageSize >= total) return;

    const nextParams = { ...queryParams, offset: nextPage * pageSize };
    queryClient.prefetchQuery({
      queryKey: ["templates", nextParams],
      queryFn: () => listTemplates(nextParams),
      staleTime: 60 * 1000,
    });
  }, [page, pageSize, queryClient, queryParams, templatesQuery.data, total]);

  useEffect(() => {
    if (!templatesQuery.error) return;
    toast.error(getApiErrorMessage(templatesQuery.error, "Failed to load templates"));
  }, [templatesQuery.error, templatesQuery.errorUpdatedAt]);

  // Reset page on filter change
  useEffect(() => {
    setPage(0);
  }, [statusFilter, categoryFilter, debouncedSearch, pageSize]);

  const refreshTemplates = () => {
    queryClient.invalidateQueries({ queryKey: ["templates"] });
  };

  // ── Handlers ──
  const syncMutation = useMutation({
    mutationFn: () => syncTemplates(),
    onMutate: () => ({ toastId: toast.loading("Syncing templates from Meta...") }),
    onSuccess: (res, _none, ctx) => {
      toast.success(getApiSuccessMessage(res, "Templates synced successfully"), { id: ctx?.toastId });
      refreshTemplates();
    },
    onError: (err, _none, ctx) => {
      toast.error(getApiErrorMessage(err, "Sync failed"), { id: ctx?.toastId });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (template: Template) => publishTemplate(template.uuid),
    onMutate: (template) => ({ toastId: toast.loading(`Publishing ${template.name}...`) }),
    onSuccess: (res, _template, ctx) => {
      toast.success(getApiSuccessMessage(res, "Template published successfully"), { id: ctx?.toastId });
      refreshTemplates();
    },
    onError: (err, _template, ctx) => {
      toast.error(getApiErrorMessage(err, "Publish failed"), { id: ctx?.toastId });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (template: Template) => deleteTemplate(template.uuid),
    onMutate: (template) => ({ toastId: toast.loading(`Deleting ${template.name}...`) }),
    onSuccess: (res, _template, ctx) => {
      toast.success(getApiSuccessMessage(res, "Template deleted"), { id: ctx?.toastId });
      setDeleteTarget(null);
      refreshTemplates();
    },
    onError: (err, _template, ctx) => {
      toast.error(getApiErrorMessage(err, "Delete failed"), { id: ctx?.toastId });
    },
  });

  const handleSync = () => {
    syncMutation.mutate();
  };

  const handlePublish = (template: Template) => {
    publishMutation.mutate(template);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // Client-side sort for current page
  const sortedTemplates = useMemo(() => {
    const list = [...templates];
    const dir = sortDir === "asc" ? 1 : -1;

    list.sort((a, b) => {
      const getValue = (item: Template) => {
        if (sortField === "created_at") {
          const ts = item.created_at ? new Date(item.created_at).getTime() : 0;
          return Number.isFinite(ts) ? ts : 0;
        }
        return String((item as any)[sortField] || "").toLowerCase();
      };

      const av = getValue(a);
      const bv = getValue(b);
      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * dir;
      }
      return String(av).localeCompare(String(bv)) * dir;
    });

    return list;
  }, [templates, sortDir, sortField]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters =
    statusFilter !== "ALL" || categoryFilter !== "ALL" || debouncedSearch;

  useEffect(() => {
    if (isInitialLoading) return;
    const maxPage = Math.max(totalPages - 1, 0);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [isInitialLoading, page, totalPages]);

  const isDeleting = deleteMutation.isPending;

  // ── SortHeader ──
  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field)
      return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-primary" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-primary" />
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
        <p className="text-sm text-muted-foreground">
          Manage your WhatsApp Business message templates
        </p>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: search + filters */}
        <div className="flex flex-1 gap-2 flex-wrap">
          <div className="relative max-w-xs flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as TemplateStatus | "ALL")}
          >
            <SelectTrigger className="h-9 w-[140px]">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="PAUSED">Paused</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={categoryFilter}
            onValueChange={(v) => setCategoryFilter(v as TemplateCategory | "ALL")}
          >
            <SelectTrigger className="h-9 w-[145px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              <SelectItem value="MARKETING">Marketing</SelectItem>
              <SelectItem value="UTILITY">Utility</SelectItem>
              <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-xs gap-1.5"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                setCategoryFilter("ALL");
              }}
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </Button>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex gap-2 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5"
                onClick={handleSync}
                disabled={syncMutation.isPending}
              >
                <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                {syncMutation.isPending ? "Syncing..." : "Sync"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Sync templates from Meta</TooltipContent>
          </Tooltip>

          <Button
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => navigate("/templates/create")}
          >
            <Plus className="w-4 h-4" />
            New Template
          </Button>
        </div>
      </div>

      {/* ── Stats strip ── */}
      {!isInitialLoading && (
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">{total}</span>{" "}
            {total === 1 ? "template" : "templates"}
            {hasFilters && " (filtered)"}
          </span>
        </div>
      )}

      {/* ── Data Grid ── */}
      <div className="flex-1 min-h-0 border border-border rounded-xl overflow-hidden bg-card shadow-sm">
        <div className="overflow-auto h-full">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur border-b border-border z-10">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  <button
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    Name <SortIcon field="name" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  <button
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    onClick={() => handleSort("category")}
                  >
                    Category <SortIcon field="category" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Language
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  <button
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    onClick={() => handleSort("status")}
                  >
                    Status <SortIcon field="status" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  <button
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    onClick={() => handleSort("created_at")}
                  >
                    Created <SortIcon field="created_at" />
                  </button>
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {isInitialLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : templatesQuery.isError && sortedTemplates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <FileText className="w-10 h-10 opacity-30" />
                      <div>
                        <p className="font-medium text-sm">Failed to load templates</p>
                        <p className="text-xs mt-0.5">Please try again</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-1 gap-1.5"
                        onClick={() => templatesQuery.refetch()}
                      >
                        <RefreshCw className="w-4 h-4" /> Retry
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : sortedTemplates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <FileText className="w-10 h-10 opacity-30" />
                      <div>
                        <p className="font-medium text-sm">No templates found</p>
                        <p className="text-xs mt-0.5">
                          {hasFilters
                            ? "Try clearing your filters"
                            : "Create your first template to get started"}
                        </p>
                      </div>
                      {!hasFilters && (
                        <Button
                          size="sm"
                          className="mt-1 gap-1.5"
                          onClick={() => navigate("/templates/create")}
                        >
                          <Plus className="w-4 h-4" /> New Template
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                sortedTemplates.map((template) => (
                  <TemplateRow
                    key={template.uuid || template.id || template.name}
                    template={template}
                    onPreview={() => setPreviewTemplate(template)}
                    onEdit={() => {
                      const templateId = template.uuid || template.id;
                      if (!templateId) {
                        toast.error("Template ID is missing. Please sync templates and try again.");
                        return;
                      }
                      navigate(`/templates/${templateId}/edit`);
                    }}
                    onPublish={() => handlePublish(template)}
                    onDelete={() => setDeleteTarget(template)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
      {!isInitialLoading && total > 0 && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Rows per page:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => setPageSize(Number(v))}
            >
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
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Preview Dialog ── */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-xl h-11/12 overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono text-base">{previewTemplate?.name}</DialogTitle>
            <DialogDescription className="flex items-center gap-2 mt-1">
              {previewTemplate && <TemplateStatusBadge status={previewTemplate.status} />}
              <span className="text-xs">
                {previewTemplate?.category} · {previewTemplate?.language}
              </span>
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="flex justify-center py-4">
              <WhatsAppPreview
                name={previewTemplate.name}
                components={previewTemplate.components}
              />
            </div>
          )}
          {previewTemplate?.rejection_reason && previewTemplate.rejection_reason !== "NONE" && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-xs text-destructive font-medium">Rejection Reason</p>
              <p className="text-xs text-destructive/80 mt-0.5">{previewTemplate.rejection_reason}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold font-mono">{deleteTarget?.name}</span>? This
              action cannot be undone and will also remove it from Meta.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Template Row ─────────────────────────────────────────────
interface TemplateRowProps {
  template: Template;
  onPreview: () => void;
  onEdit: () => void;
  onPublish: () => void;
  onDelete: () => void;
}

function TemplateRow({
  template,
  onPreview,
  onEdit,
  onPublish,
  onDelete,
}: TemplateRowProps) {
  const categoryColors: Record<string, string> = {
    MARKETING: "bg-violet-100 text-violet-700 border-violet-200",
    UTILITY: "bg-blue-100 text-blue-700 border-blue-200",
    AUTHENTICATION: "bg-orange-100 text-orange-700 border-orange-200",
  };




  return (
    <tr className="hover:bg-muted/40 transition-colors group">
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <button
            onClick={onPreview}
            className="font-medium font-mono text-xs text-foreground hover:text-primary transition-colors text-left"
          >
            {template.name}
          </button>
          {template.meta_template_id && (
            <span className="text-[10px] text-muted-foreground mt-0.5">
              #{template.meta_template_id}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge
          variant="outline"
          className={`text-xs font-medium ${categoryColors[template.category] || ""}`}
        >
          {template.category}
        </Badge>
      </td>
      <td className="px-4 py-3 text-muted-foreground text-xs">{template.language}</td>
      <td className="px-4 py-3">
        <TemplateStatusBadge status={template.status} />
      </td>
      <td className="px-4 py-3 text-muted-foreground text-xs">
        {template.created_at
          ? new Date(template.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
          : "—"}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={onPreview}
              >
                <Eye className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Preview</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={onEdit}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onPreview}>
                <Eye className="w-4 h-4 mr-2" /> Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onPublish}>
                <CloudUpload className="w-4 h-4 mr-2" /> Publish / Sync
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}
