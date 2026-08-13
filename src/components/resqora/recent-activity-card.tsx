import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { emergenciesQuery } from "@/lib/api";
import { formatDuration, statusLabel } from "@/lib/emergency";
import { useHydrated } from "@/hooks/use-hydrated";

/** Last few real emergency sessions recorded for the signed-in user. */
export function RecentActivityCard({ limit = 3 }: { limit?: number }) {
  const { user } = useAuth();
  const hydrated = useHydrated();
  const emergencies = useQuery(emergenciesQuery(user?.id));
  const list = (emergencies.data ?? []).slice(0, limit);

  return (
    <section aria-label="Recent emergency activity" className="glass-panel rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <History className="size-4 text-primary" aria-hidden="true" />
          Recent emergency activity
        </h2>
        <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
          <Link to="/history">View all</Link>
        </Button>
      </div>

      {list.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-border/70 p-4 text-center text-sm text-muted-foreground">
          {user ? "No emergencies recorded yet." : "Sign in to see your emergency history."}
        </p>
      ) : (
        <ul className="mt-3 grid gap-2">
          {list.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold capitalize text-foreground">
                  {item.type.replace(/_/g, " ")} · {statusLabel(item.status)}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {hydrated ? new Date(item.started_at).toLocaleString() : ""}
                  {item.address ? ` · ${item.address}` : ""}
                </p>
              </div>
              <Badge
                variant="secondary"
                className="shrink-0 rounded-full text-[10px] font-semibold"
              >
                {formatDuration(item.duration_seconds)}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
