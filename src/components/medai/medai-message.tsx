import {
  AlertTriangle,
  Bot,
  ImageIcon,
  Navigation,
  Siren,
  Stethoscope,
  UserRound,
  Volume2,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { FirstAidChecklist } from "@/components/medai/first-aid-checklist";
import { UrgencyBadge } from "@/components/medai/urgency-badge";
import type { MedAiAssessment } from "@/lib/medai.server";

export type MedAiBubble = {
  id: string;
  role: "user" | "assistant";
  content: string;
  hasImage?: boolean;
  imagePreview?: string | null;
  assessment?: MedAiAssessment | null;
};

/** Doctor-style assistant card / patient bubble. */
export function MedAiMessage({
  message,
  onSpeak,
  onActivateSos,
  hospitalNavigateUrl,
}: {
  message: MedAiBubble;
  onSpeak?: (text: string) => void;
  onActivateSos?: () => void;
  hospitalNavigateUrl?: string | null;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end gap-2">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-sm">
          {message.imagePreview && (
            <img
              src={message.imagePreview}
              alt="Photo shared with the medical assistant"
              className="mb-2 max-h-44 w-full rounded-xl object-cover"
            />
          )}
          {message.hasImage && !message.imagePreview && (
            <p className="mb-1 flex items-center gap-1.5 text-xs opacity-80">
              <ImageIcon className="size-3.5" aria-hidden="true" /> Photo attached
            </p>
          )}
          <p className="whitespace-pre-wrap">{message.content}</p>
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
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
        <Stethoscope className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 space-y-3 rounded-2xl rounded-tl-md border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <Bot className="size-3.5" aria-hidden="true" /> RESQORA MedAI
          </p>
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

        {assessment && (
          <UrgencyBadge urgency={assessment.urgency} reason={assessment.urgencyReason} />
        )}

        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

        {assessment?.possibleCause && (
          <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Possible cause
            </p>
            <p className="mt-1 text-sm">{assessment.possibleCause}</p>
          </div>
        )}

        {assessment?.immediateSteps?.length ? (
          <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Immediate steps
            </p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-sm">
              {assessment.immediateSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        ) : null}

        {assessment?.imageObservation && (
          <p className="rounded-xl bg-muted/50 p-3 text-sm">
            <span className="font-semibold">What I can see: </span>
            {assessment.imageObservation}
          </p>
        )}

        {assessment?.emergency && (
          <div className="rounded-2xl border border-alert/40 bg-alert/10 p-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-alert">
              <AlertTriangle className="size-4" aria-hidden="true" /> Possible life-threatening
              emergency
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Get emergency help now — activating SOS alerts your contacts with your live location.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {onActivateSos && (
                <Button size="sm" variant="destructive" className="h-10" onClick={onActivateSos}>
                  <Siren className="size-4" /> Activate SOS
                </Button>
              )}
              <Button asChild size="sm" variant="outline" className="h-10">
                <a href="tel:108">Call 108</a>
              </Button>
              {hospitalNavigateUrl && (
                <Button asChild size="sm" variant="outline" className="h-10">
                  <a href={hospitalNavigateUrl} target="_blank" rel="noreferrer">
                    <Navigation className="size-4" /> Nearest emergency hospital
                  </a>
                </Button>
              )}
              <Button asChild size="sm" variant="ghost" className="h-10">
                <Link to="/emergency">Emergency console</Link>
              </Button>
            </div>
          </div>
        )}

        {assessment?.firstAid?.length ? <FirstAidChecklist steps={assessment.firstAid} /> : null}

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
    </div>
  );
}
