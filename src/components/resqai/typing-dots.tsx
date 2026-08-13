import { ResqAvatar } from "@/components/resqai/resq-avatar";

/** ChatGPT-style typing indicator while the assessment is generated. */
export function TypingDots({ label = "RESQ AI is thinking…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2" role="status" aria-live="polite">
      <ResqAvatar size={32} pulse />
      <span className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-border/60 bg-card/70 px-4 py-3">
        <span className="flex gap-1" aria-hidden="true">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="size-2 animate-bounce rounded-full bg-primary/70"
              style={{ animationDelay: `${dot * 0.15}s` }}
            />
          ))}
        </span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </span>
    </div>
  );
}
