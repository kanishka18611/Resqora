import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Bell, BellRing, CheckCheck, Info, Siren } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/system/page-header";
import { EmptyState } from "@/components/system/empty-state";
import { PanelSkeleton } from "@/components/system/loading-skeletons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { notificationsQuery } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — RESQORA" },
      {
        name: "description",
        content:
          "Your RESQORA notification centre: emergency status updates, safety tips and account notices in one place.",
      },
      { property: "og:title", content: "RESQORA Notifications" },
      {
        property: "og:description",
        content: "Emergency updates, safety tips and account notices.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotificationsPage,
});

const tabs = ["all", "unread", "emergency"] as const;

const icons: Record<string, typeof Bell> = {
  emergency: Siren,
  safety: Info,
  system: Bell,
};

function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery(notificationsQuery(user?.id));
  const [tab, setTab] = useState<(typeof tabs)[number]>("all");

  const unread = (data ?? []).filter((item) => !item.read).length;

  const items = useMemo(() => {
    const all = data ?? [];
    if (tab === "unread") return all.filter((item) => !item.read);
    if (tab === "emergency") return all.filter((item) => item.category === "emergency");
    return all;
  }, [data, tab]);

  async function markAll() {
    if (!user) return;
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
    toast.success("All notifications marked as read");
  }

  async function markOne(id: string) {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    await queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
  }

  return (
    <>
      <PageHeader
        icon={BellRing}
        title="Notifications"
        description="Emergency updates, safety guidance and account notices."
        actions={
          unread > 0 ? (
            <Button variant="outline" onClick={markAll}>
              <CheckCheck className="size-4" />
              Mark all read
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            aria-pressed={tab === item}
            className={cn(
              "flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors",
              tab === item
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {item}
            {item === "unread" && unread > 0 && (
              <Badge className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px]">
                {unread}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PanelSkeleton rows={4} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Nothing to read"
          description="Emergency status changes and safety updates will appear here as they happen."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item, index) => {
            const Icon = icons[item.category ?? "system"] ?? Bell;
            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: index * 0.03 }}
                className={cn(
                  "glass-panel flex items-start gap-4 rounded-2xl p-4",
                  !item.read && "ring-1 ring-primary/30",
                )}
              >
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-xl",
                    item.category === "emergency"
                      ? "bg-alert/10 text-alert"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    {!item.read && (
                      <span className="size-2 rounded-full bg-primary" aria-label="Unread" />
                    )}
                  </div>
                  {item.body && <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
                {!item.read && (
                  <Button size="sm" variant="ghost" onClick={() => markOne(item.id)}>
                    Mark read
                  </Button>
                )}
              </motion.li>
            );
          })}
        </ul>
      )}
    </>
  );
}
