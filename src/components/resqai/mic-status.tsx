import { Mic, MicOff, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MicState } from "@/hooks/use-mic-permission";

/** Honest microphone state — never says "ready" unless a real mic was opened. */
export function MicStatus({
  state,
  error,
  onEnable,
}: {
  state: MicState;
  error: string | null;
  onEnable: () => void;
}) {
  if (state === "checking") return null;

  if (state === "granted")
    return (
      <p className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
        <Mic className="size-3.5" aria-hidden="true" /> Microphone ready — tap voice and speak.
      </p>
    );

  if (state === "prompt")
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
        <Mic className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          Microphone access is needed so RESQ AI can hear your symptoms hands-free.
        </span>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onEnable}>
          Enable microphone
        </Button>
      </div>
    );

  return (
    <div className="rounded-xl border border-alert/40 bg-alert/5 px-3 py-2 text-xs text-foreground">
      <p className="flex items-center gap-2 font-semibold">
        {state === "denied" ? (
          <MicOff className="size-3.5 shrink-0" aria-hidden="true" />
        ) : (
          <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
        )}
        {state === "denied"
          ? "Microphone access is blocked"
          : state === "unavailable"
            ? "Microphone unavailable"
            : "Voice input isn’t supported here"}
      </p>
      <p className="mt-1 text-muted-foreground">
        {error ??
          "Type your question instead — everything else in RESQ AI works without a microphone."}
      </p>
      {state === "denied" && (
        <p className="mt-1 text-muted-foreground">
          Tap the lock or camera icon in the address bar → Site settings → allow Microphone, then
          reload. On iPhone: Settings → Safari → Microphone → Allow.
        </p>
      )}
    </div>
  );
}
