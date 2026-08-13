import { CheckCircle2, CircleDashed } from "lucide-react";
import { guardianEnded, type GuardianView } from "@/lib/guardian-view";

/** Communication & live-link status, derived from real delivery and GPS records. */
export function GuardianStatusGrid({ view }: { view: GuardianView }) {
  const live = !guardianEnded(view);
  const lastPing = view.track[0]?.created_at ?? view.location_updated_at;
  const updating = Boolean(live && lastPing && Date.now() - new Date(lastPing).getTime() < 120_000);
  const items: { label: string; ok: boolean; detail: string }[] = [
    {
      label: "Guardian email delivered",
      ok: view.email_delivered,
      detail: view.email_delivered
        ? "Alert email sent"
        : view.guardian_email_on_file
          ? "Sending / not confirmed"
          : "No email on file",
    },
    { label: "Guardian opened dashboard", ok: true, detail: "Access logged" },
    { label: "Live tracking active", ok: live, detail: live ? "Link valid" : "Emergency ended" },
    { label: "SOS active", ok: live, detail: view.status.replace(/_/g, " ") },
    {
      label: "Location updating",
      ok: updating,
      detail: lastPing ? new Date(lastPing).toLocaleTimeString() : "No GPS yet",
    },
    {
      label: "AI summary ready",
      ok: Boolean(view.ai_summary),
      detail: view.ai_summary ? "Analysis available" : "Awaiting analysis",
    },
  ];

  return (
    <section className="glass-panel rounded-3xl p-4">
      <h2 className="font-display text-lg font-bold">Communication status</h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-start gap-2 rounded-2xl bg-card/70 p-3">
            {item.ok ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
            ) : (
              <CircleDashed
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            )}
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{item.label}</span>
              <span className="block text-[11px] capitalize text-muted-foreground">
                {item.detail}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
