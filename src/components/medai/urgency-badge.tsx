import { urgencyMeta, type Urgency } from "@/lib/medai";

export function UrgencyBadge({ urgency, reason }: { urgency: Urgency; reason?: string | null }) {
  const meta = urgencyMeta[urgency];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${meta.chip}`}
      >
        <span className={`size-2 rounded-full ${meta.dot}`} aria-hidden="true" />
        {meta.emoji} {meta.label}
      </span>
      {reason && <span className="text-xs text-muted-foreground">{reason}</span>}
    </div>
  );
}
