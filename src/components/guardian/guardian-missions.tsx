import { useState } from "react";
import { CheckCircle2, Circle, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { missionList, setGuardianTask, type GuardianView } from "@/lib/guardian-view";
import { cn } from "@/lib/utils";

/** Guardian mission panel — actionable tasks the Guardian ticks off live. */
export function GuardianMissions({
  view,
  emergencyId,
  token,
  onSaved,
}: {
  view: GuardianView;
  emergencyId: string;
  token: string;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const missions = missionList(view);
  const done = missions.filter((mission) => mission.done).length;

  const toggle = async (taskKey: string, label: string, next: boolean) => {
    setBusy(taskKey);
    try {
      await setGuardianTask({ emergencyId, token, taskKey, label, done: next });
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the task");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="glass-panel rounded-3xl p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <ListChecks className="size-5 text-primary" aria-hidden="true" />
          Guardian mission panel
        </h2>
        <span className="text-xs font-semibold text-muted-foreground">
          {done}/{missions.length} complete
        </span>
      </div>
      <Progress value={(done / missions.length) * 100} className="mt-3 h-2" />
      <ul className="mt-3 space-y-2">
        {missions.map((mission) => (
          <li key={mission.task_key}>
            <button
              type="button"
              disabled={busy === mission.task_key}
              onClick={() => toggle(mission.task_key, mission.label, !mission.done)}
              className={cn(
                "flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition",
                mission.done ? "border-success/40 bg-success/10" : "hover:bg-muted/60",
              )}
            >
              {mission.done ? (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
              ) : (
                <Circle
                  className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
              <span className="min-w-0">
                <span className={cn("block text-sm font-semibold", mission.done && "line-through")}>
                  {mission.label}
                </span>
                {mission.done && mission.completed_at && (
                  <span className="block text-[11px] text-muted-foreground">
                    {mission.completed_by} · {new Date(mission.completed_at).toLocaleTimeString()}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
