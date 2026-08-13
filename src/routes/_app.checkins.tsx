import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { AlarmClock, BellRing, CheckCircle2, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/system/page-header";
import { EmptyState } from "@/components/system/empty-state";
import { PanelSkeleton } from "@/components/system/loading-skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { CHECKIN_PRESETS, checkinsQuery } from "@/lib/resqora-data";
import { logActivity } from "@/lib/activity";
import { pushPermission, requestPushPermission, showPush } from "@/lib/push";
import { useCheckinWatcher } from "@/hooks/use-checkin-watcher";

export const Route = createFileRoute("/_app/checkins")({
  head: () => ({
    meta: [
      { title: "Safety check-ins — RESQORA" },
      {
        name: "description",
        content:
          "Schedule an RESQORA safety check-in. If you don't confirm you're safe in time, RESQORA automatically triggers your SOS workflow.",
      },
      { property: "og:title", content: "RESQORA Safety Check-ins" },
      {
        property: "og:description",
        content: "Timed safety confirmations with automatic SOS escalation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CheckinsPage,
});

function CheckinsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const checkins = useQuery(checkinsQuery(user?.id));
  const [label, setLabel] = useState<string>(CHECKIN_PRESETS[0].value);
  const [minutes, setMinutes] = useState<number>(CHECKIN_PRESETS[0].minutes);
  const [note, setNote] = useState("");

  useCheckinWatcher();

  const create = useMutation({
    mutationFn: async () => {
      const dueAt = new Date(Date.now() + minutes * 60_000).toISOString();
      const { error } = await supabase.from("safety_checkins").insert({
        user_id: user!.id,
        label,
        note: note.trim() || null,
        due_at: dueAt,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      setNote("");
      toast.success(`Check-in set for ${minutes} minutes from now`);
      showPush("Safety check-in scheduled", `${label} — confirm within ${minutes} minutes.`);
      await logActivity(user?.id, "Safety check-in scheduled", `${label} in ${minutes} min`);
      await queryClient.invalidateQueries({ queryKey: ["safety-checkins", user?.id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function update(
    id: string,
    patch: { status: string; confirmed_at?: string },
    message: string,
  ) {
    const { error } = await supabase.from("safety_checkins").update(patch).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(message);
    await queryClient.invalidateQueries({ queryKey: ["safety-checkins", user?.id] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("safety_checkins").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["safety-checkins", user?.id] });
  }

  const pending = (checkins.data ?? []).filter((item) => item.status === "pending");
  const past = (checkins.data ?? []).filter((item) => item.status !== "pending");

  return (
    <>
      <PageHeader
        icon={AlarmClock}
        title="Safety check-ins"
        description="Set a timer before you travel. Miss it, and RESQORA raises an SOS for you automatically."
        actions={
          pushPermission() === "granted" ? (
            <Badge variant="secondary" className="rounded-full">
              Reminders on
            </Badge>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const result = await requestPushPermission();
                toast[result === "granted" ? "success" : "error"](
                  result === "granted"
                    ? "Browser reminders enabled"
                    : "Reminders were not enabled in this browser",
                );
              }}
            >
              <BellRing className="size-4" />
              Enable reminders
            </Button>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="glass-panel space-y-4 rounded-3xl p-5">
          <h2 className="text-sm font-semibold text-foreground">Schedule a check-in</h2>
          <div className="space-y-2">
            <Label htmlFor="checkin-label">What are you doing?</Label>
            <Select
              value={label}
              onValueChange={(value) => {
                setLabel(value);
                const preset = CHECKIN_PRESETS.find((item) => item.value === value);
                if (preset) setMinutes(preset.minutes);
              }}
            >
              <SelectTrigger id="checkin-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHECKIN_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkin-minutes">Confirm within (minutes)</Label>
            <Input
              id="checkin-minutes"
              type="number"
              min={1}
              max={720}
              value={minutes}
              onChange={(event) => setMinutes(Math.max(1, Number(event.target.value) || 1))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkin-note">Note for your contacts (optional)</Label>
            <Input
              id="checkin-note"
              value={note}
              placeholder="Taking a cab from the airport"
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
          <Button
            variant="hero"
            className="w-full"
            disabled={create.isPending || !user}
            onClick={() => create.mutate()}
          >
            <Clock className="size-4" />
            Start check-in timer
          </Button>
          <p className="text-xs text-muted-foreground">
            Keep RESQORA open in a tab — if the timer runs out without a confirmation, your SOS
            workflow starts and your trusted contacts are alerted.
          </p>
        </div>

        <div className="space-y-4">
          {checkins.isLoading ? (
            <PanelSkeleton rows={3} />
          ) : pending.length === 0 && past.length === 0 ? (
            <EmptyState
              icon={AlarmClock}
              title="No check-ins yet"
              description="Schedule one before you travel alone or head home late."
            />
          ) : (
            <>
              <div className="glass-panel rounded-3xl p-5">
                <h2 className="text-sm font-semibold text-foreground">Active timers</h2>
                {pending.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">Nothing running right now.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {pending.map((item, index) => (
                      <motion.li
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/60 p-4"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{item.label}</p>
                          <p className="text-xs text-muted-foreground">
                            Due {new Date(item.due_at).toLocaleString()}
                            {item.note ? ` · ${item.note}` : ""}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="hero"
                            onClick={() =>
                              update(
                                item.id,
                                { status: "confirmed", confirmed_at: new Date().toISOString() },
                                "Marked safe — timer cleared",
                              )
                            }
                          >
                            <CheckCircle2 className="size-4" />
                            I'm safe
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              update(item.id, { status: "cancelled" }, "Check-in cancelled")
                            }
                          >
                            Cancel
                          </Button>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="glass-panel rounded-3xl p-5">
                <h2 className="text-sm font-semibold text-foreground">Past check-ins</h2>
                <ul className="mt-4 space-y-2">
                  {past.length === 0 && (
                    <li className="text-sm text-muted-foreground">No history yet.</li>
                  )}
                  {past.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card/60 p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.due_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={item.status === "missed" ? "destructive" : "secondary"}
                          className="rounded-full text-[10px] capitalize"
                        >
                          {item.status}
                        </Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Delete check-in"
                          onClick={() => remove(item.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
