import { ClipboardCheck } from "lucide-react";
import { checklistFor } from "@/lib/checklists";

/** Immediate do-this-now instructions for the current emergency type. */
export function EmergencyChecklist({ type }: { type: string | null | undefined }) {
  const checklist = checklistFor(type);
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-alert/12 text-alert">
          <ClipboardCheck className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Do this now</h2>
          <p className="text-xs text-muted-foreground">{checklist.title}</p>
        </div>
      </div>
      <ul className="mt-3 space-y-2">
        {checklist.steps.map((step) => (
          <li key={step} className="flex gap-2 text-sm text-foreground">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-alert" aria-hidden="true" />
            {step}
          </li>
        ))}
      </ul>
    </div>
  );
}
