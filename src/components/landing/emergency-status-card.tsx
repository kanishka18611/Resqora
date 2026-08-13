import { motion } from "motion/react";
import { Clock, MapPin, Satellite } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LivePosition } from "@/hooks/use-live-position";
import { useHydrated } from "@/hooks/use-hydrated";

export type LandingStatus = "safe" | "checkin" | "active" | "coordinating" | "resolved";

const STATUS_META: Record<LandingStatus, { label: string; dot: string; ring: string }> = {
  safe: { label: "SAFE", dot: "bg-success", ring: "text-success" },
  checkin: {
    label: "Safety check pending",
    dot: "bg-warning",
    ring: "text-warning",
  },
  active: { label: "EMERGENCY ACTIVE", dot: "bg-alert", ring: "text-alert" },
  coordinating: {
    label: "EMERGENCY ACTIVE",
    dot: "bg-alert",
    ring: "text-alert",
  },
  resolved: {
    label: "EMERGENCY RESOLVED",
    dot: "bg-success",
    ring: "text-success",
  },
};

export function EmergencyStatusCard({
  status,
  now,
  position,
  address,
  denied,
  resolvingAddress,
}: {
  status: LandingStatus;
  now: Date;
  position: LivePosition | null;
  address: string | null;
  denied: boolean;
  resolvingAddress?: boolean;
}) {
  const meta = STATUS_META[status];
  const locationLabel = address
    ? address
    : position
      ? resolvingAddress
        ? "Resolving address…"
        : `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`
      : denied
        ? "Add your address to continue"
        : "Getting your location…";
  // Locale time only renders after hydration so SSR markup can't mismatch.
  const hydrated = useHydrated();
  const critical = status === "active" || status === "coordinating";
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      aria-label="Live safety status"
      className={cn(
        "soft-card rounded-3xl p-5 sm:p-7",
        critical && "border-alert/50 bg-alert/5 ring-1 ring-alert/30",
      )}
    >
      <dl className="grid gap-5 divide-border/70 sm:grid-cols-3 sm:gap-0 sm:divide-x">
        <div className="min-w-0 sm:pr-6">
          <dt className="flex items-center gap-2">
            <span
              className={cn("size-2.5 shrink-0 animate-pulse rounded-full", meta.dot)}
              aria-hidden="true"
            />
            <span className={cn("font-display text-base font-extrabold tracking-tight", meta.ring)}>
              {meta.label}
            </span>
          </dt>
          <dd className="mt-3">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Current address
            </span>
            <span className="mt-1 flex items-start gap-1.5 text-sm font-semibold text-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden="true" />
              <span className="min-w-0 break-words">{locationLabel}</span>
            </span>
          </dd>
        </div>

        <div className="min-w-0 sm:px-6">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            GPS accuracy
          </dt>
          <dd className="mt-2 flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight text-foreground">
            <Satellite className="size-5 shrink-0 text-teal" aria-hidden="true" />
            {position ? `±${Math.round(position.accuracy)} m` : "—"}
          </dd>
        </div>

        <div className="min-w-0 sm:pl-6">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Last update
          </dt>
          <dd className="mt-2 flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight text-foreground">
            <Clock className="size-5 shrink-0 text-teal" aria-hidden="true" />
            <span className="font-mono text-xl sm:text-2xl">
              {hydrated ? now.toLocaleTimeString() : "--:--:--"}
            </span>
          </dd>
        </div>
      </dl>
    </motion.section>
  );
}
