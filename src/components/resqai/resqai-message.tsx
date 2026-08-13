import { useEffect, useState } from "react";
import { Copy, ImageIcon, UserRound, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownLite } from "@/components/resqai/markdown-lite";
import { ResqAvatar } from "@/components/resqai/resq-avatar";
import { ResqEmergencyCard } from "@/components/resqai/emergency-card";
import { StepCards } from "@/components/resqai/step-cards";
import { UrgencyBadge } from "@/components/medai/urgency-badge";
import { messageTime } from "@/lib/resqai";
import type { MedAiAssessment } from "@/lib/medai.server";

export type ResqBubble = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  hasImage?: boolean;
  imagePreview?: string | null;
  assessment?: MedAiAssessment | null;
  /** Reveal the answer with a typing animation (newest reply only). */
  stream?: boolean;
};

/** Progressive reveal so answers read as if they were streamed. */
function useTypedText(text: string, enabled: boolean) {
  const [shown, setShown] = useState(enabled ? "" : text);

  useEffect(() => {
    if (!enabled) {
      setShown(text);
      return;
    }
    setShown("");
    let index = 0;
    const timer = setInterval(() => {
      index = Math.min(text.length, index + Math.max(2, Math.round(text.length / 90)));
      setShown(text.slice(0, index));
      if (index >= text.length) clearInterval(timer);
    }, 22);
    return () => clearInterval(timer);
  }, [text, enabled]);

  return shown;
}

export function ResqAiMessage({
  message,
  onSpeak,
  onActivateSos,
  onShareLocation,
  hospitalNavigateUrl,
}: {
  message: ResqBubble;
  onSpeak?: (text: string) => void;
  onActivateSos?: () => void;
  onShareLocation?: () => void;
  hospitalNavigateUrl?: string | null;
}) {
  const typed = useTypedText(
    message.content,
    message.role === "assistant" && Boolean(message.stream),
  );

  if (message.role === "user") {
    return (
      <div className="flex justify-end gap-2">
        <div className="max-w-[85%]">
          <div className="rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm text-primary-foreground shadow-sm">
            {message.imagePreview && (
              <img
                src={message.imagePreview}
                alt="Photo shared with RESQ AI"
                className="mb-2 max-h-48 w-full rounded-xl object-cover"
              />
            )}
            {message.hasImage && !message.imagePreview && (
              <p className="mb-1 flex items-center gap-1.5 text-xs opacity-80">
                <ImageIcon className="size-3.5" aria-hidden="true" /> Photo attached
              </p>
            )}
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          <p className="mt-1 text-right text-[11px] text-muted-foreground">
            {messageTime(message.createdAt)}
          </p>
        </div>
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
          <UserRound className="size-4" aria-hidden="true" />
        </span>
      </div>
    );
  }

  const assessment = message.assessment ?? null;

  return (
    <div className="flex gap-2">
      <ResqAvatar size={32} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="space-y-3 rounded-2xl rounded-tl-md border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              RESQ AI
            </p>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="size-8"
                onClick={() => void navigator.clipboard?.writeText(message.content)}
                aria-label="Copy this answer"
              >
                <Copy className="size-4" />
              </Button>
              {onSpeak && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  onClick={() => onSpeak(message.content)}
                  aria-label="Read this answer aloud"
                >
                  <Volume2 className="size-4" />
                </Button>
              )}
            </div>
          </div>

          {assessment && (
            <UrgencyBadge urgency={assessment.urgency} reason={assessment.urgencyReason} />
          )}

          <MarkdownLite text={typed} />

          {assessment?.possibleCause && (
            <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Possible cause
              </p>
              <p className="mt-1 text-sm">{assessment.possibleCause}</p>
            </div>
          )}

          {assessment?.immediateSteps?.length ? (
            <StepCards steps={assessment.immediateSteps} title="Do this right now" tone="alert" />
          ) : null}

          {assessment?.imageObservation && (
            <p className="rounded-xl bg-muted/50 p-3 text-sm">
              <span className="font-semibold">What I can see: </span>
              {assessment.imageObservation}
            </p>
          )}

          {assessment?.emergency && (
            <ResqEmergencyCard
              headline="Possible life-threatening emergency"
              onActivateSos={onActivateSos}
              onShareLocation={onShareLocation}
              hospitalNavigateUrl={hospitalNavigateUrl ?? null}
            />
          )}

          {assessment?.firstAid?.length ? <StepCards steps={assessment.firstAid} /> : null}

          {assessment?.whenToSeekCare && (
            <div className="rounded-2xl border border-alert/30 bg-alert/5 p-3">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                When to seek emergency care
              </p>
              <p className="mt-1 text-sm">{assessment.whenToSeekCare}</p>
            </div>
          )}

          {assessment?.specialist && (
            <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Recommended specialist
              </p>
              <p className="mt-1 text-sm font-semibold">{assessment.specialist}</p>
              {assessment.specialistReason && (
                <p className="mt-1 text-xs text-muted-foreground">{assessment.specialistReason}</p>
              )}
            </div>
          )}

          {assessment?.redFlags?.length ? (
            <div className="rounded-2xl border border-warning/40 bg-warning/10 p-3">
              <p className="text-xs font-semibold tracking-wide uppercase">Go to hospital if</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs">
                {assessment.redFlags.map((flag) => (
                  <li key={flag}>{flag}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {assessment?.followUpQuestion && (
            <p className="rounded-xl bg-primary/10 p-3 text-sm font-medium text-primary">
              {assessment.followUpQuestion}
            </p>
          )}
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">{messageTime(message.createdAt)}</p>
      </div>
    </div>
  );
}
