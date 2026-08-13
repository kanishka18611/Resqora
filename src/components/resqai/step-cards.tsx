import { ListChecks } from "lucide-react";

/**
 * First Aid Mode: numbered step cards a bystander can follow one at a time.
 */
export function StepCards({
  steps,
  title = "First aid — follow in order",
  tone = "primary",
}: {
  steps: string[];
  title?: string;
  tone?: "primary" | "alert";
}) {
  if (steps.length === 0) return null;
  const badge =
    tone === "alert" ? "bg-alert text-alert-foreground" : "bg-primary text-primary-foreground";

  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <ListChecks className="size-4" aria-hidden="true" /> {title}
      </p>
      <ol className="space-y-2">
        {steps.map((step, index) => (
          <li
            key={`${index}-${step.slice(0, 14)}`}
            className="flex items-start gap-3 rounded-xl border border-border/50 bg-card/60 p-3"
          >
            <span
              className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${badge}`}
            >
              {index + 1}
            </span>
            <span className="text-sm leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
