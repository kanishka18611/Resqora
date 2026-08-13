import { ShieldCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { StatusIndicator } from "@/components/system/status-indicator";
import { scoreTone } from "@/lib/api";

export function SafetyScoreCard({ score, hints }: { score: number; hints: string[] }) {
  const tone = scoreTone(score);
  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Safety score</p>
            <p className="font-display text-3xl font-semibold text-foreground">{score}</p>
          </div>
        </div>
        <StatusIndicator status={tone.status} label={tone.label} />
      </div>
      <Progress value={score} className="mt-4 h-2" />
      {hints.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {hints.map((hint) => (
            <li key={hint} className="flex gap-2 text-sm text-muted-foreground">
              <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-alert" />
              {hint}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
