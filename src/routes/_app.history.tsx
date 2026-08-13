import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Clock, History, MapPin, Search, Siren } from "lucide-react";
import { PageHeader } from "@/components/system/page-header";
import { StatCard } from "@/components/system/stat-card";
import { StatusIndicator } from "@/components/system/status-indicator";
import { EmptyState } from "@/components/system/empty-state";
import { PanelSkeleton } from "@/components/system/loading-skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { emergenciesQuery } from "@/lib/api";
import { formatDuration, statusLabel } from "@/lib/emergency";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/history")({
  head: () => ({
    meta: [
      { title: "Emergency history — RESQORA" },
      {
        name: "description",
        content:
          "A complete timeline of your RESQORA emergencies with type, severity, location, duration and outcome.",
      },
      { property: "og:title", content: "RESQORA Emergency History" },
      {
        property: "og:description",
        content: "Every alert, response time and outcome in one timeline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoryPage,
});

const filters = ["all", "resolved", "cancelled", "active"] as const;

function HistoryPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery(emergenciesQuery(user?.id));
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [search, setSearch] = useState("");

  const items = useMemo(() => {
    let all = data ?? [];
    if (filter === "active") {
      all = all.filter((item) => item.status !== "resolved" && item.status !== "cancelled");
    } else if (filter !== "all") {
      all = all.filter((item) => item.status === filter);
    }
    const term = search.trim().toLowerCase();
    if (!term) return all;
    return all.filter((item) =>
      [
        item.type,
        item.status,
        item.notes ?? "",
        item.address ?? "",
        new Date(item.started_at).toLocaleString(),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [data, filter, search]);

  const resolved = (data ?? []).filter((item) => item.status === "resolved");
  const avg =
    resolved.length > 0
      ? Math.round(
          resolved.reduce((sum, i) => sum + (i.duration_seconds ?? 0), 0) / resolved.length,
        )
      : null;

  return (
    <>
      <PageHeader
        icon={History}
        title="Emergency history"
        description="Every alert you've raised, with response times and outcomes."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Siren} label="Total emergencies" value={String(data?.length ?? 0)} />
        <StatCard icon={Clock} label="Avg. resolution" value={avg ? formatDuration(avg) : "—"} />
        <StatCard icon={History} label="Resolved" value={String(resolved.length)} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by type, status, notes or date"
            aria-label="Search emergency history"
            className="pl-9"
          />
        </div>
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            aria-pressed={filter === item}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors",
              filter === item
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {item}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PanelSkeleton rows={3} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={History}
          title="No records here"
          description="When you raise an emergency, the full response timeline is archived on this page."
          action={
            <Button asChild variant="hero">
              <Link to="/emergency">Open emergency console</Link>
            </Button>
          }
        />
      ) : (
        <ol className="relative space-y-4 border-l border-border pl-6">
          {items.map((item, index) => (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: index * 0.04 }}
              className="glass-panel relative rounded-2xl p-5"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute -left-[31px] top-7 size-3 rounded-full ring-4 ring-background",
                  item.status === "resolved"
                    ? "bg-success"
                    : item.status === "cancelled"
                      ? "bg-muted-foreground"
                      : "bg-alert",
                )}
              />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold capitalize text-foreground">
                    {item.type} emergency
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(item.started_at).toLocaleString()}
                  </p>
                </div>
                <StatusIndicator
                  status={
                    item.status === "resolved"
                      ? "safe"
                      : item.status === "cancelled"
                        ? "offline"
                        : "critical"
                  }
                  label={statusLabel(item.status)}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5" aria-hidden="true" />
                  {formatDuration(item.duration_seconds)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {item.latitude != null && item.longitude != null
                    ? `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`
                    : "Location unavailable"}
                </span>
                <span className="capitalize">Severity: {item.severity}</span>
              </div>
              {item.notes && <p className="mt-3 text-sm text-foreground">{item.notes}</p>}
            </motion.li>
          ))}
        </ol>
      )}
    </>
  );
}
