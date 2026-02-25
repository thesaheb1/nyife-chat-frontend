import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowUpDown,
  Copy,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  Ban,
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
import { FlowScreenPreview } from "@/components/flows/FlowTemplateForm";

import {
  cloneFlow,
  deleteFlow,
  listFlows,
  publishFlow,
  retireFlow,
  syncFlowStatuses,
  syncFlowStatus,
} from "@/services/flow.service";
import type { FlowStatus, FlowTemplate } from "@/types/flow.types";

const PAGE_SIZES = [10, 20, 50];

export default function FlowsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<FlowStatus | "ALL">("ALL");
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(0);

  const [previewFlow, setPreviewFlow] = useState<FlowTemplate | null>(null);
  const [previewScreenKey, setPreviewScreenKey] = useState("");
  const [previewHistory, setPreviewHistory] = useState<string[]>([]);

  const [cloneTarget, setCloneTarget] = useState<FlowTemplate | null>(null);
  const [cloneName, setCloneName] = useState("");
  const [cloneKey, setCloneKey] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<FlowTemplate | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const query = useQuery({
    queryKey: ["flows", { debouncedSearch, status, limit, page }],
    queryFn: () =>
      listFlows({
        limit,
        offset: page * limit,
        ...(status !== "ALL" ? { status } : {}),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      }),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["flows"] });
  };

  const publishMutation = useMutation({
    mutationFn: (id: string) => publishFlow(id),
    onSuccess: () => {
      toast.success("Flow published successfully");
      refresh();
    },
    onError: (err: Error) => toast.error(err.message || "Publish failed"),
  });

  const retireMutation = useMutation({
    mutationFn: (id: string) => retireFlow(id),
    onSuccess: () => {
      toast.success("Flow retired successfully");
      refresh();
    },
    onError: (err: Error) => toast.error(err.message || "Retire failed"),
  });

  const syncOneMutation = useMutation({
    mutationFn: (id: string) => syncFlowStatus(id),
    onSuccess: () => {
      toast.success("Flow status synced");
      refresh();
    },
    onError: (err: Error) => toast.error(err.message || "Sync failed"),
  });

  const syncAllMutation = useMutation({
    mutationFn: () => syncFlowStatuses(100, 0, false),
    onSuccess: () => {
      toast.success("Flow statuses synced");
      refresh();
    },
    onError: (err: Error) => toast.error(err.message || "Sync failed"),
  });

  const cloneMutation = useMutation({
    mutationFn: ({ id, name, template_key }: { id: string; name: string; template_key: string }) =>
      cloneFlow(id, { name, template_key }),
    onSuccess: () => {
      toast.success("Flow cloned");
      setCloneTarget(null);
      setCloneName("");
      setCloneKey("");
      refresh();
    },
    onError: (err: Error) => toast.error(err.message || "Clone failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFlow(id),
    onSuccess: () => {
      toast.success("Flow deleted");
      setDeleteTarget(null);
      refresh();
    },
    onError: (err: Error) => toast.error(err.message || "Delete failed"),
  });

  const flows = query.data?.data || [];
  const total = query.data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const previewScreen = useMemo(() => {
    if (!previewFlow) return undefined;
    return (
      previewFlow.screens.find((s) => s.key === previewScreenKey) ||
      previewFlow.screens.find((s) => s.is_entry_point) ||
      previewFlow.screens[0]
    );
  }, [previewFlow, previewScreenKey]);

  useEffect(() => {
    if (!previewFlow) return;
    const startKey = previewFlow.screens.find((s) => s.is_entry_point)?.key || previewFlow.screens[0]?.key || "";
    setPreviewScreenKey(startKey);
    setPreviewHistory(startKey ? [startKey] : []);
  }, [previewFlow]);

  const handlePreviewBack = () => {
    setPreviewHistory((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.slice(0, -1);
      const target = next[next.length - 1];
      if (target) setPreviewScreenKey(target);
      return next;
    });
  };

  const handlePreviewNavigate = (action: FlowTemplate["screens"][number]["actions"][number]) => {
    if (action.type === "previous_screen") {
      handlePreviewBack();
      return;
    }
    if (action.type === "next_screen" && action.target_screen_key) {
      setPreviewScreenKey(action.target_screen_key);
      setPreviewHistory((prev) => [...prev, action.target_screen_key as string]);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Flows</h1>
          <p className="text-sm text-muted-foreground">Create and manage WhatsApp Flow templates.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => syncAllMutation.mutate()} disabled={syncAllMutation.isPending}>
            <RefreshCw className="mr-2 size-4" />
            Sync Status
          </Button>
          <Button onClick={() => navigate("/flows/create")}> 
            <Plus className="mr-2 size-4" />
            Create Flow
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search flow by name or key"
              className="pl-9"
            />
          </div>

          <Select value={status} onValueChange={(v) => setStatus(v as FlowStatus | "ALL")}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="DRAFT">DRAFT</SelectItem>
              <SelectItem value="PUBLISHED">PUBLISHED</SelectItem>
              <SelectItem value="DEPRECATED">DEPRECATED</SelectItem>
              <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="h-full overflow-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="sticky top-0 bg-muted/70 backdrop-blur">
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Template Key</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Screens</th>
                <th className="px-4 py-3 text-right font-medium">
                  <span className="inline-flex items-center gap-1">
                    Actions <ArrowUpDown className="size-3.5" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {query.isLoading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/60">
                    <td className="px-4 py-3" colSpan={6}>
                      <Skeleton className="h-6 w-full" />
                    </td>
                  </tr>
                ))}

              {!query.isLoading && flows.length === 0 && (
                <tr>
                  <td className="px-4 py-10 text-center text-muted-foreground" colSpan={6}>
                    No flows found.
                  </td>
                </tr>
              )}

              {!query.isLoading &&
                flows.map((flow) => (
                  <tr key={flow.id} className="border-b border-border/60 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium">{flow.name}</div>
                      {flow.flowId && <div className="text-xs text-muted-foreground">Meta: {flow.flowId}</div>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{flow.template_key}</td>
                    <td className="px-4 py-3 text-xs">{flow.category?.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{flow.status || "UNKNOWN"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs">{flow.screens?.length || 0}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setPreviewFlow(flow)}>
                            <Eye className="mr-2 size-4" /> Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/flows/${flow.id}/update`)}>
                            <Pencil className="mr-2 size-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => publishMutation.mutate(flow.id)}>
                            <UploadCloud className="mr-2 size-4" /> Publish
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => retireMutation.mutate(flow.id)}>
                            <Ban className="mr-2 size-4" /> Retire
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => syncOneMutation.mutate(flow.id)}>
                            <RefreshCw className="mr-2 size-4" /> Sync Status
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setCloneTarget(flow);
                              setCloneName(`${flow.name} Clone`);
                              setCloneKey(`${flow.template_key}_clone`);
                            }}
                          >
                            <Copy className="mr-2 size-4" /> Clone
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(flow)}>
                            <Trash2 className="mr-2 size-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground">{total} flow(s)</div>
        <div className="flex items-center gap-2">
          <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(0); }}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>
            Prev
          </Button>
          <span className="text-xs text-muted-foreground">Page {page + 1} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>

      <Dialog
        open={Boolean(previewFlow)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewFlow(null);
            setPreviewHistory([]);
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewFlow?.name}</DialogTitle>
            <DialogDescription>{previewFlow?.description || "Flow preview"}</DialogDescription>
          </DialogHeader>

          {previewFlow && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[240px_1fr]">
              <div className="rounded-lg border border-border p-2">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Screens</p>
                <div className="space-y-1">
                  {previewFlow.screens.map((screen) => (
                    <button
                      type="button"
                      key={screen.key}
                      className={`w-full rounded-md border px-2 py-1.5 text-left text-xs ${
                        previewScreen?.key === screen.key
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border"
                      }`}
                      onClick={() => setPreviewScreenKey(screen.key)}
                    >
                      {screen.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border p-3">
                <FlowScreenPreview
                  flowName={previewFlow.name || "Business"}
                  category={previewFlow.category}
                  screen={previewScreen}
                  onNavigate={handlePreviewNavigate}
                  canGoBack={previewHistory.length > 1}
                  onHeaderBack={handlePreviewBack}
                  availableScreenKeys={new Set((previewFlow.screens || []).map((s) => s.key))}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Flow</DialogTitle>
            <DialogDescription>
              This will permanently remove <strong>{deleteTarget?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
