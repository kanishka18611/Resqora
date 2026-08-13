import { motion } from "motion/react";
import { Brain, CircleAlert, Clock, Hospital, Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABEL } from "@/lib/accident";
import type { CoordinatorPlan } from "@/lib/coordinator.functions";

const PRIORITY_CHIP: Record<CoordinatorPlan["priority"], string> = {
  green: "border-success/40 bg-success/10 text-success",
  yellow: "border-warning/40 bg-warning/10 text-warning",
  orange: "border-warning/60 bg-warning/15 text-warning",
  red: "border-alert/60 bg-alert/15 text-alert",
};

/**
 * Module 2 surface: the AI Emergency Action Plan. Regenerating replaces the plan
 * whenever new information (location, notes, AI findings) arrives.
 */
export function ActionPlanCard({
  plan,
  loading,
  error,
  onRegenerate,
}: {
  plan: CoordinatorPlan | null;
  loading: boolean;
  error?: string | null;
  onRegenerate: () => void;
}) {
  return (
    <section aria-label="AI emergency action plan" className="glass-panel rounded-3xl p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <Brain className="size-4 text-primary" aria-hidden="true" />
            AI Emergency Coordinator
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Dynamic action plan regenerated as the emergency develops.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={onRegenerate} disabled={loading}>
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCcw className="size-4" aria-hidden="true" />
          )}
          {plan ? "Regenerate" : "Generate plan"}
        </Button>
      </div>

      {error && (
        <p className="mt-3 rounded-2xl border border-alert/40 bg-alert/10 p-3 text-xs text-alert">
          {error}
        </p>
      )}

      {!plan && !error && (
        <p className="mt-3 rounded-2xl border border-dashed border-border/60 p-4 text-xs text-muted-foreground">
          {loading
            ? "Building the emergency action plan from your location, medical profile and nearby responders…"
            : "No plan yet — generate one to get prioritised actions, responder roles and an ETA."}
        </p>
      )}

      {plan && (
        <div className="mt-4 grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={`rounded-full text-[10px] font-semibold uppercase ${PRIORITY_CHIP[plan.priority]}`}
            >
              Priority {PRIORITY_LABEL[plan.priority]}
            </Badge>
            <Badge variant="secondary" className="rounded-full text-[10px] font-semibold uppercase">
              {plan.incidentType}
            </Badge>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3.5" aria-hidden="true" />
              ETA ≈ {plan.etaMinutes} min
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Hospital className="size-3.5" aria-hidden="true" />
              {plan.hospitalType}
            </span>
          </div>

          <p className="text-sm font-medium text-foreground">{plan.headline}</p>

          <ol className="grid gap-2">
            {plan.actions.map((action, index) => (
              <motion.li
                key={`${action.title}-${index}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-3 rounded-2xl border border-border/60 bg-background/60 p-3"
              >
                <span
                  aria-hidden="true"
                  className={`grid size-7 shrink-0 place-items-center rounded-xl text-xs font-bold ${
                    action.urgent ? "bg-alert/15 text-alert" : "bg-primary/10 text-primary"
                  }`}
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{action.title}</p>
                  {action.detail && (
                    <p className="text-xs text-muted-foreground">{action.detail}</p>
                  )}
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {action.role}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>

          {plan.watchFor.length > 0 && (
            <div className="rounded-2xl border border-warning/40 bg-warning/10 p-3">
              <p className="inline-flex items-center gap-2 text-xs font-semibold text-warning">
                <CircleAlert className="size-3.5" aria-hidden="true" />
                Watch for
              </p>
              <ul className="mt-1 grid gap-1 text-xs text-foreground">
                {plan.watchFor.map((sign) => (
                  <li key={sign}>• {sign}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground">
            Plan generated {new Date(plan.generatedAt).toLocaleTimeString()} · AI guidance supports,
            never replaces, professional emergency care.
          </p>
        </div>
      )}
    </section>
  );
}
