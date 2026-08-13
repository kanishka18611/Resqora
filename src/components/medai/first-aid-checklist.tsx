import { useState } from "react";
import { Check, ListChecks } from "lucide-react";

/** Tickable first-aid checklist so a bystander can track their progress. */
export function FirstAidChecklist({
  steps,
  title = "First aid checklist",
}: {
  steps: string[];
  title?: string;
}) {
  const [done, setDone] = useState<Record<number, boolean>>({});
  if (steps.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-3">
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <ListChecks className="size-4" aria-hidden="true" /> {title}
      </p>
      <ul className="space-y-1.5">
        {steps.map((step, index) => {
          const checked = Boolean(done[index]);
          return (
            <li key={`${index}-${step.slice(0, 12)}`}>
              <button
                type="button"
                onClick={() => setDone((prev) => ({ ...prev, [index]: !prev[index] }))}
                aria-pressed={checked}
                className="flex w-full items-start gap-2.5 rounded-xl p-2 text-left text-sm transition hover:bg-muted/50"
              >
                <span
                  className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border ${
                    checked
                      ? "border-safe bg-safe text-safe-foreground"
                      : "border-border text-transparent"
                  }`}
                >
                  <Check className="size-3.5" aria-hidden="true" />
                </span>
                <span className={checked ? "text-muted-foreground line-through" : ""}>{step}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
