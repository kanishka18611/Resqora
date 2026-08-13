import { CheckCircle2, History } from "lucide-react";
import type { TimelineEntry } from "@/lib/accident";

/** Automatic, timestamped record of the whole response. */
export function ResponseTimeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <section
      aria-label="Emergency response timeline"
      className="glass-panel rounded-3xl p-4 sm:p-5"
    >
      <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
        <History className="size-4 text-primary" aria-hidden="true" />
        Response timeline
      </h2>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Events appear here the moment you report the incident.
        </p>
      ) : (
        <ol className="mt-4 space-y-3">
          {entries.map((entry, index) => (
            <li key={`${entry.label}-${index}`} className="flex gap-3">
              <span className="flex flex-col items-center">
                <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
                {index < entries.length - 1 && <span className="mt-1 h-6 w-px bg-border" />}
              </span>
              <div className="min-w-0 pb-0.5">
                <p className="text-sm font-medium text-foreground">
                  {entry.label}
                  <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
                    {entry.at.toLocaleTimeString()}
                  </span>
                </p>
                {entry.detail && <p className="text-xs text-muted-foreground">{entry.detail}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
