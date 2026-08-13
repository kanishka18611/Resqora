import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Camera, QrCode, ShieldCheck, Siren, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useHydrated } from "@/hooks/use-hydrated";
import { emergenciesQuery } from "@/lib/api";
import { activityQuery } from "@/lib/activity";
import { conversationsQuery } from "@/lib/medai";

type FeedItem = {
  id: string;
  kind: string;
  icon: typeof Siren;
  title: string;
  detail: string;
  at: string;
};

function matches(action: string, words: string[]) {
  const value = action.toLowerCase();
  return words.some((word) => value.includes(word));
}

/** Unified recent activity: SOS, reports, guardian alerts, QR scans, AI chats. */
export function RecentActivityFeed({ limit = 5 }: { limit?: number }) {
  const { user } = useAuth();
  const hydrated = useHydrated();
  const emergencies = useQuery(emergenciesQuery(user?.id));
  const logs = useQuery(activityQuery(user?.id));
  const conversations = useQuery(conversationsQuery(user?.id));

  const items: FeedItem[] = [];

  for (const item of emergencies.data ?? []) {
    const isReport = /report|accident/i.test(item.type);
    items.push({
      id: `emergency-${item.id}`,
      kind: isReport ? "Incident report" : "SOS",
      icon: isReport ? Camera : Siren,
      title: isReport ? "Incident report" : "Emergency SOS",
      detail: item.address ?? item.type.replace(/_/g, " "),
      at: item.started_at,
    });
  }

  for (const log of logs.data ?? []) {
    if (matches(log.action, ["guardian"])) {
      items.push({
        id: `log-${log.id}`,
        kind: "Guardian notification",
        icon: ShieldCheck,
        title: log.action,
        detail: log.detail ?? "Guardian alerted",
        at: log.created_at,
      });
    } else if (matches(log.action, ["scan", "resqr", "qr"])) {
      items.push({
        id: `log-${log.id}`,
        kind: "QR scan",
        icon: QrCode,
        title: log.action,
        detail: log.detail ?? "RESQR ID scanned",
        at: log.created_at,
      });
    }
  }

  for (const chat of conversations.data ?? []) {
    items.push({
      id: `chat-${chat.id}`,
      kind: "AI consultation",
      icon: Stethoscope,
      title: chat.title || "AI consultation",
      detail: "RESQ AI medical assistant",
      at: chat.updated_at ?? chat.created_at,
    });
  }

  const feed = items
    .filter((item) => Boolean(item.at))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);

  // Hidden entirely when there is nothing to show — keeps Home short.
  if (feed.length === 0) return null;

  return (
    <section aria-label="Recent activity" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground sm:text-xl">
          Recent Activity
        </h2>
        <Button asChild variant="ghost" size="sm" className="h-9 rounded-2xl text-xs font-bold">
          <Link to="/history">View all</Link>
        </Button>
      </div>

      <ul className="soft-card divide-y divide-border/60 rounded-3xl px-4">
        {feed.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-3.5">
            <span
              aria-hidden="true"
              className="grid size-10 shrink-0 place-items-center rounded-2xl bg-teal/10 text-teal"
            >
              <item.icon className="size-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {item.kind}
                {item.detail ? ` · ${item.detail}` : ""}
              </p>
            </div>
            <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
              {hydrated ? new Date(item.at).toLocaleDateString() : ""}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
