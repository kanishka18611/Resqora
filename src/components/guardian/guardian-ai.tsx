import { Brain, HeartPulse, Hospital, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { NearbyPlace } from "@/lib/nearby.server";
import type { GuardianView } from "@/lib/guardian-view";

/**
 * AI emergency summary. Everything shown comes from the analysis already stored
 * on the emergency by the RESQORA AI Coordinator / Accident Response Engine —
 * nothing is invented here, and guidance is always marked AI-assisted.
 */
export function GuardianAiSummary({
  view,
  hospital,
}: {
  view: GuardianView;
  hospital?: NearbyPlace;
}) {
  const priority =
    view.severity === "critical" || view.severity === "high"
      ? "P1 — immediate response"
      : view.severity === "medium"
        ? "P2 — urgent response"
        : "P3 — monitored response";
  const recommendedHospital =
    view.preferred_hospital || hospital?.name || view.ai_recommendation || null;

  return (
    <section className="glass-panel rounded-3xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <Brain className="size-5 text-primary" aria-hidden="true" />
          AI emergency summary
        </h2>
        <Badge variant="outline" className="rounded-full text-[10px]">
          <Sparkles className="mr-1 size-3" aria-hidden="true" />
          AI-assisted guidance
        </Badge>
      </div>

      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <Row label="Emergency type" value={view.type.replace(/_/g, " ")} />
        <Row label="Estimated severity" value={view.severity} />
        <Row label="Priority" value={priority} />
        <Row
          label="Possible situation"
          value={view.ai_summary ?? "Awaiting AI analysis from the emergency owner's device."}
        />
        <Row
          label="Recommended actions"
          value={
            view.ai_recommendation ??
            "Keep the person still, stay on the line and await responders."
          }
        />
        <Row
          label="Recommended hospital"
          value={recommendedHospital ?? "Nearest emergency-capable hospital"}
        />
        <Row label="Recommended specialist" value={specialistFor(view.type)} />
        <Row
          label="Estimated travel time"
          value={
            hospital
              ? `${hospital.etaMinutes} min · ${hospital.distanceKm.toFixed(1)} km`
              : "Calculating from live GPS"
          }
        />
      </dl>

      {view.ai_first_aid.length > 0 && (
        <div className="mt-4 rounded-2xl bg-card/70 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <HeartPulse className="size-4 text-alert" aria-hidden="true" />
            Recommended first aid
          </p>
          <ol className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            {view.ai_first_aid.map((step, index) => (
              <li key={`${step}-${index}`} className="flex gap-2">
                <span className="font-semibold text-foreground">{index + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {view.notes && (
        <p className="mt-3 rounded-2xl bg-muted/60 p-3 text-sm">
          <span className="font-semibold">Scene notes: </span>
          {view.notes}
        </p>
      )}

      <p className="mt-3 flex items-start gap-2 text-[11px] text-muted-foreground">
        <Hospital className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        AI-assisted guidance only — it is not a medical diagnosis. Always follow the instructions of
        emergency responders and treating doctors.
      </p>
    </section>
  );
}

function specialistFor(type: string) {
  const key = type.toLowerCase();
  if (key.includes("cardiac") || key.includes("heart")) return "Cardiologist / emergency physician";
  if (key.includes("accident") || key.includes("crash") || key.includes("trauma"))
    return "Trauma & orthopaedic surgeon";
  if (key.includes("fire") || key.includes("burn")) return "Burns & plastic surgery unit";
  if (key.includes("breath") || key.includes("respir")) return "Pulmonologist / critical care";
  if (key.includes("medical")) return "Emergency physician";
  return "Emergency physician (triage on arrival)";
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card/70 p-3">
      <dt className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold capitalize">{value}</dd>
    </div>
  );
}
