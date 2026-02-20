import { Badge } from "@/components/ui/badge";
import type { TemplateStatus } from "@/types/template.types";

const statusConfig: Record<
  TemplateStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" | string; className: string }
> = {
  APPROVED: {
    label: "Approved",
    variant: "default",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  },
  PENDING: {
    label: "Pending",
    variant: "secondary",
    className: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
  },
  REJECTED: {
    label: "Rejected",
    variant: "destructive",
    className: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100",
  },
  PAUSED: {
    label: "Paused",
    variant: "secondary",
    className: "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100",
  },
  DISABLED: {
    label: "Disabled",
    variant: "secondary",
    className: "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-100",
  },
  IN_APPEAL: {
    label: "In Appeal",
    variant: "outline",
    className: "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100",
  },
  PENDING_DELETION: {
    label: "Pending Delete",
    variant: "destructive",
    className: "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100",
  },
  DELETED: {
    label: "Deleted",
    variant: "secondary",
    className: "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100",
  },
};

interface TemplateStatusBadgeProps {
  status: TemplateStatus;
}

export default function TemplateStatusBadge({ status }: TemplateStatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: "bg-gray-100 text-gray-600",
  };
  return (
    <Badge variant="outline" className={`text-xs font-medium capitalize ${config.className}`}>
      {config.label}
    </Badge>
  );
}
