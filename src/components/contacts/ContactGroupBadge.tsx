import { Badge } from "@/components/ui/badge";

const GROUP_BADGE_STYLES = [
  "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  "bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-100",
  "bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-100",
  "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
  "bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100",
  "bg-cyan-100 text-cyan-700 border-cyan-200 hover:bg-cyan-100",
  "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-100",
  "bg-lime-100 text-lime-700 border-lime-200 hover:bg-lime-100",
] as const;

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getBadgeClassName = (name: string, groupId?: number): string => {
  const index = typeof groupId === "number" && Number.isFinite(groupId)
    ? Math.abs(groupId) % GROUP_BADGE_STYLES.length
    : hashString(name) % GROUP_BADGE_STYLES.length;

  return GROUP_BADGE_STYLES[index] || GROUP_BADGE_STYLES[0];
};

interface ContactGroupBadgeProps {
  name: string;
  groupId?: number;
  className?: string;
}

export default function ContactGroupBadge({ name, groupId, className }: ContactGroupBadgeProps) {
  const colorClass = getBadgeClassName(name, groupId);

  return (
    <Badge variant="outline" className={`text-xs font-medium ${colorClass} ${className || ""}`.trim()}>
      {name}
    </Badge>
  );
}
