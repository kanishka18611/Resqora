import { AlertTriangle, Droplets, Languages, Pill, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { GuardianView } from "@/lib/guardian-view";

/** Medical profile released to the assigned Guardian for this emergency only. */
export function GuardianMedical({ view }: { view: GuardianView }) {
  return (
    <section className="glass-panel rounded-3xl p-4">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold">
        <Stethoscope className="size-5 text-primary" aria-hidden="true" />
        Medical profile
      </h2>

      <div className="mt-3 flex items-center gap-3">
        {view.avatar_url ? (
          <img
            src={view.avatar_url}
            alt={`${view.full_name} profile photo`}
            className="size-14 rounded-2xl object-cover"
            loading="lazy"
          />
        ) : (
          <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 font-display font-bold">
            {view.full_name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-display text-base font-bold">{view.full_name}</p>
          <p className="text-xs text-muted-foreground">
            {view.age != null ? `${view.age} years` : "Age not recorded"}
            {view.blood_group ? ` · Blood group ${view.blood_group}` : ""}
          </p>
        </div>
        {view.blood_group && (
          <Badge className="ml-auto rounded-full bg-alert/15 text-alert">
            <Droplets className="mr-1 size-3" aria-hidden="true" />
            {view.blood_group}
          </Badge>
        )}
      </div>

      {view.allergies ? (
        <p className="mt-3 flex items-start gap-2 rounded-2xl border border-alert/50 bg-alert/10 p-3 text-sm font-semibold text-alert">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Critical allergies: {view.allergies}
        </p>
      ) : (
        <p className="mt-3 rounded-2xl bg-card/70 p-3 text-sm text-muted-foreground">
          No allergies recorded.
        </p>
      )}

      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Medical conditions" value={view.medical_conditions || "None recorded"} />
        <Field label="Current medicines" value={view.medications || "None recorded"} icon={Pill} />
        <Field
          label="Preferred hospital"
          value={view.preferred_hospital || "Nearest emergency hospital"}
        />
        <Field
          label="Preferred language"
          value={view.preferred_language || "Not set"}
          icon={Languages}
        />
      </dl>

      {view.medical_notes.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Emergency notes
          </p>
          {view.medical_notes.map((note, index) => (
            <div key={`${note.title}-${index}`} className="rounded-2xl bg-card/70 p-3">
              <p className="text-sm font-semibold">
                {note.title}
                <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                  {note.category}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Field({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Pill }) {
  return (
    <div className="rounded-2xl bg-card/70 p-3">
      <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {Icon && <Icon className="size-3.5" aria-hidden="true" />}
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold">{value}</dd>
    </div>
  );
}
