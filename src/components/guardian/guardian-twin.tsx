import { Activity, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { NearbyPlace } from "@/lib/nearby.server";
import { guardianEnded, missionList, movementOf, type GuardianView } from "@/lib/guardian-view";

/** Emergency phase inferred from the real status and coordination progress. */
function phaseOf(view: GuardianView) {
  if (guardianEnded(view)) return "Phase 5 · Closed";
  if (view.live_status === "assistance_en_route" || view.status === "en_route")
    return "Phase 4 · Assistance en route";
  if (view.status === "contacts_notified") return "Phase 3 · Network alerted";
  if (view.status === "active") return "Phase 2 · Response coordination";
  return "Phase 1 · Detection & locating";
}

/** Live Digital Twin mirror of the incident for the Guardian. */
export function GuardianTwin({ view, hospital }: { view: GuardianView; hospital?: NearbyPlace }) {
  const missions = missionList(view);
  const movement = movementOf(view.track);
  const live = !guardianEnded(view);

  return (
    <section className="glass-panel rounded-3xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <Radio className="size-5 text-primary" aria-hidden="true" />
          Emergency digital twin
        </h2>
        <Badge variant="outline" className="rounded-full text-[10px]">
          {live ? "Auto-updating" : "Frozen at resolution"}
        </Badge>
      </div>
      <p className="mt-2 flex items-center gap-2 text-sm font-semibold">
        <Activity className="size-4 text-alert" aria-hidden="true" />
        {phaseOf(view)}
      </p>

      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <Cell label="Status" value={view.status.replace(/_/g, " ")} />
        <Cell
          label="Location"
          value={
            view.latitude != null && view.longitude != null
              ? `${view.latitude.toFixed(4)}, ${view.longitude.toFixed(4)}`
              : "Awaiting GPS"
          }
        />
        <Cell label="Movement" value={movement.label} />
        <Cell
          label="Medical"
          value={
            [
              view.blood_group ? `Blood ${view.blood_group}` : null,
              view.allergies ? "allergies on file" : null,
              view.medical_conditions ? "conditions on file" : null,
            ]
              .filter(Boolean)
              .join(" · ") || "No medical data recorded"
          }
        />
        <Cell label="AI summary" value={view.ai_summary ? "Ready" : "Pending"} />
        <Cell label="Timeline events" value={`${view.timeline.length} logged`} />
        <Cell label="Guardian" value={view.guardian_name} />
        <Cell
          label="Hospital"
          value={view.preferred_hospital || hospital?.name || "Nearest emergency hospital"}
        />
        <Cell
          label="Emergency contacts"
          value={view.contacts.length ? `${view.contacts.length} on file` : "None saved"}
        />
        <Cell
          label="Mission progress"
          value={`${missions.filter((m) => m.done).length}/${missions.length} tasks done`}
        />
        <Cell
          label="Scene media"
          value={view.ai_summary ? "AI scene analysis attached" : "No media analysed"}
        />
        <Cell label="Guardian notes" value={`${view.guardian_notes.length} recorded`} />
      </dl>

      {view.contacts.length > 0 && (
        <ul className="mt-3 space-y-2">
          {view.contacts.map((contact) => (
            <li
              key={`${contact.name}-${contact.phone}`}
              className="flex items-center justify-between gap-2 rounded-2xl bg-card/70 p-3"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  {contact.name}
                  {contact.is_guardian && (
                    <Badge className="ml-2 rounded-full bg-primary/15 text-primary">Guardian</Badge>
                  )}
                </span>
                <span className="block text-xs text-muted-foreground">{contact.relationship}</span>
              </span>
              <a href={`tel:${contact.phone}`} className="text-sm font-semibold text-primary">
                Call
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card/70 p-3">
      <dt className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold capitalize">{value}</dd>
    </div>
  );
}
