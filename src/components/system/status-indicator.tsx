import { cn } from "@/lib/utils";
import type { StatusLevel } from "@/types";

const config: Record<StatusLevel, { label: string; dot: string; chip: string }> = {
  safe: { label: "Safe", dot: "bg-success", chip: "bg-success/10 text-success" },
  active: { label: "Active", dot: "bg-info", chip: "bg-info/10 text-info" },
  warning: { label: "Attention", dot: "bg-warning", chip: "bg-warning/15 text-warning" },
  critical: { label: "Critical", dot: "bg-alert", chip: "bg-alert/10 text-alert" },
  offline: { label: "Offline", dot: "bg-muted-foreground", chip: "bg-muted text-muted-foreground" },
};

export function StatusIndicator({
  status,
  label,
  pulse = false,
  className,
}: {
  status: StatusLevel;
  label?: string;
  pulse?: boolean;
  className?: string;
}) {
  const item = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
        item.chip,
        className,
      )}
    >
      <span className="relative flex size-2">
        {pulse && (
          <span
            className={cn(
              "absolute inline-flex size-full animate-ping rounded-full opacity-70",
              item.dot,
            )}
          />
        )}
        <span className={cn("relative inline-flex size-2 rounded-full", item.dot)} />
      </span>
      {label ?? item.label}
    </span>
  );
}
