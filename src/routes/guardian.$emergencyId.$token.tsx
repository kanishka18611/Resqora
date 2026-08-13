import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { GuardianAiSummary } from "@/components/guardian/guardian-ai";
import { GuardianHandover } from "@/components/guardian/guardian-handover";
import { GuardianHeader } from "@/components/guardian/guardian-header";
import { GuardianMap } from "@/components/guardian/guardian-map";
import { GuardianMedical } from "@/components/guardian/guardian-medical";
import { GuardianMissions } from "@/components/guardian/guardian-missions";
import { GuardianNotes } from "@/components/guardian/guardian-notes";
import { GuardianQuickActions } from "@/components/guardian/guardian-quick-actions";
import { GuardianServices } from "@/components/guardian/guardian-services";
import { GuardianStatusGrid } from "@/components/guardian/guardian-status-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import type { NearbyPlace, PlaceCategory } from "@/lib/nearby.server";
import { guardianViewQuery } from "@/lib/guardian-view";

export const Route = createFileRoute("/guardian/$emergencyId/$token")({
  head: () => ({
    meta: [
      { title: "Guardian command centre — RESQORA emergency" },
      {
        name: "description",
        content:
          "Secure RESQORA Guardian command centre: live location, AI emergency summary, medical profile, handover card and nearest emergency services.",
      },
      { property: "og:title", content: "RESQORA Guardian command centre" },
      {
        property: "og:description",
        content: "Live emergency command centre for the nominated Guardian.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GuardianDashboard,
});

function GuardianDashboard() {
  const { emergencyId, token } = Route.useParams();
  const [nearest, setNearest] = useState<Partial<Record<PlaceCategory, NearbyPlace>>>({});
  const [now, setNow] = useState(() => Date.now());

  const view = useQuery(guardianViewQuery(emergencyId, token));

  useEffect(() => {
    // Records the Guardian visit on the account owner's audit trail — the
    // database only writes the entry while the Guardian token is still valid.
    void supabase.rpc("log_guardian_access", { _emergency_id: emergencyId, _token: token });
  }, [emergencyId, token]);

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  if (view.isLoading) {
    return (
      <main className="mx-auto max-w-5xl space-y-4 p-4">
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-72 rounded-3xl" />
      </main>
    );
  }

  const data = view.data ?? null;

  if (!data) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <Logo />
        <h1 className="font-display text-2xl font-bold">Guardian link expired</h1>
        <p className="text-sm text-muted-foreground">
          This Guardian command centre is no longer available. Emergency links carry a secure
          temporary token, work for a single emergency and expire automatically once it ends.
        </p>
      </main>
    );
  }

  const dashboardUrl = typeof window === "undefined" ? "" : window.location.href;
  const hospital = nearest.hospital;

  return (
    <main className="aurora min-h-screen">
      <div className="mx-auto max-w-3xl space-y-4 p-4 pb-6 sm:p-6">
        <header className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Guardian command centre
              </p>
              <p className="text-sm font-semibold">Hello {data.guardian_name}</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Secure link · reference {data.reference}
          </p>
        </header>

        <GuardianHeader view={data} now={now} />

        {/* One scrollable command centre: every section appears exactly once. */}
        <GuardianStatusGrid view={data} />

        <GuardianMap view={data} />

        <GuardianHandover view={data} dashboardUrl={dashboardUrl} />

        <GuardianMedical view={data} />

        <GuardianAiSummary view={data} hospital={hospital} />

        <section className="glass-panel rounded-3xl p-4">
          <h2 className="font-display text-lg font-bold">Emergency timeline</h2>
          <ol className="mt-3 space-y-3">
            {data.timeline.length === 0 && (
              <li className="text-sm text-muted-foreground">Awaiting the first event.</li>
            )}
            {[...data.timeline].reverse().map((event, index) => (
              <li key={`${event.label}-${event.created_at}-${index}`} className="flex gap-3">
                <span
                  className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{event.label}</p>
                  {event.detail && <p className="text-xs text-muted-foreground">{event.detail}</p>}
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(event.created_at).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <GuardianMissions
          view={data}
          emergencyId={emergencyId}
          token={token}
          onSaved={() => void view.refetch()}
        />

        <section className="glass-panel rounded-3xl p-4">
          <h2 className="font-display text-lg font-bold">Nearest emergency services</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Live, emergency-capable responders around {data.full_name.split(" ")[0]}’s current
            position.
          </p>
          <GuardianServices lat={data.latitude} lng={data.longitude} onNearest={setNearest} />
        </section>

        <GuardianNotes
          view={data}
          emergencyId={emergencyId}
          token={token}
          onSaved={() => void view.refetch()}
        />

        <GuardianQuickActions view={data} hospital={hospital} dashboardUrl={dashboardUrl} />

        <footer className="flex items-center justify-center gap-2 pb-4 text-center text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
          Emergency-only view · medical details are released to the assigned Guardian for this
          incident and the link expires when the emergency ends.
        </footer>
      </div>
    </main>
  );
}
