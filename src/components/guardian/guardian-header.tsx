import { motion } from "motion/react";
import { Activity, Clock, MapPin, ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDuration, statusLabel } from "@/lib/emergency";
import { guardianEnded, type GuardianView } from "@/lib/guardian-view";

/** Large emergency banner: active (red) or resolved (green), with live elapsed time. */
export function GuardianHeader({ view, now }: { view: GuardianView; now: number }) {
  const ended = guardianEnded(view);
  const elapsed = ended
    ? (view.duration_seconds ??
      Math.max(
        0,
        Math.round(
          (new Date(view.resolved_at ?? view.started_at).getTime() -
            new Date(view.started_at).getTime()) /
            1000,
        ),
      ))
    : Math.max(0, Math.round((now - new Date(view.started_at).getTime()) / 1000));

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`overflow-hidden rounded-3xl border p-5 ${
        ended ? "border-success/40 bg-success/10" : "border-alert/50 bg-alert/10"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-display text-lg font-bold">
          {ended ? (
            <>
              <ShieldCheck className="size-5 text-success" aria-hidden="true" />
              🟢 Emergency resolved
            </>
          ) : (
            <>
              <ShieldAlert className="size-5 animate-pulse text-alert" aria-hidden="true" />
              🔴 Emergency active
            </>
          )}
        </p>
        <Badge variant="outline" className="rounded-full text-[11px] font-semibold">
          Severity · {view.severity}
        </Badge>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        {view.avatar_url ? (
          <img
            src={view.avatar_url}
            alt={`${view.full_name} profile photo`}
            className="size-16 rounded-2xl object-cover"
            loading="lazy"
          />
        ) : (
          <div className="grid size-16 place-items-center rounded-2xl bg-primary/10 font-display text-xl font-bold">
            {view.full_name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold">{view.full_name}</h1>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4" aria-hidden="true" />
            {view.address ?? "Resolving address…"}
          </p>
          <p className="text-xs text-muted-foreground">
            Emergency ID {view.reference} · {view.type.replace(/_/g, " ")}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Cell icon={Clock} label="Started" value={new Date(view.started_at).toLocaleTimeString()} />
        <Cell
          icon={Activity}
          label={ended ? "Total duration" : "Elapsed"}
          value={formatDuration(elapsed)}
        />
        <Cell icon={Activity} label="Status" value={statusLabel(view.status)} />
        <Cell
          icon={MapPin}
          label="Last updated"
          value={
            view.location_updated_at ? new Date(view.location_updated_at).toLocaleTimeString() : "—"
          }
        />
        <Cell
          icon={ended ? ShieldCheck : ShieldAlert}
          label={ended ? "Resolved at" : "Live status"}
          value={
            ended
              ? view.resolved_at
                ? new Date(view.resolved_at).toLocaleTimeString()
                : "Just now"
              : view.live_status.replace(/_/g, " ")
          }
        />
      </dl>
    </motion.section>
  );
}

function Cell({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card/70 p-3">
      <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold capitalize">{value}</dd>
    </div>
  );
}
