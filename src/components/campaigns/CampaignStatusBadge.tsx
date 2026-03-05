import { Badge } from "@/components/ui/badge";
import type { CampaignStatus } from "@/types/campaign.types";

const STATUS_CONFIG: Record<CampaignStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100",
  },
  scheduled: {
    label: "Scheduled",
    className: "bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-100",
  },
  running: {
    label: "Running",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  },
  paused: {
    label: "Paused",
    className: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-100",
  },
};

interface CampaignStatusBadgeProps {
  status?: string;
}

export default function CampaignStatusBadge({ status }: CampaignStatusBadgeProps) {
  const normalized = (status || "draft").toLowerCase() as CampaignStatus;
  const config = STATUS_CONFIG[normalized] || STATUS_CONFIG.draft;

  return (
    <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
      {config.label}
    </Badge>
  );
}
