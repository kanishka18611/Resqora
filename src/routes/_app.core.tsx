import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Camera, Cpu, QrCode, Radar, Siren } from "lucide-react";
import { PageHeader } from "@/components/system/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { activeEmergencyQuery, contactsQuery, emergenciesQuery } from "@/lib/api";
import { myResqrIdQuery } from "@/lib/resqr";
import { MODULE_STATE_META, cachedPlan, coreModules, emergencyReference } from "@/lib/core";

const MODULE_ICON = {
  twin: Radar,
  coordinator: Cpu,
  resqr: QrCode,
  accident: Camera,
} as const;

export const Route = createFileRoute("/_app/core")({
  head: () => ({
    meta: [
      { title: "RESQORA CORE — AI Emergency Coordination System" },
      {
        name: "description",
        content:
          "RESQORA CORE brings the Emergency Digital Twin, AI Emergency Coordinator, RESQR ID and AI Accident Response Engine into one live command view.",
      },
      { property: "og:title", content: "RESQORA CORE" },
      {
        property: "og:description",
        content: "One command view for every RESQORA emergency intelligence module.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CorePage,
});

function CorePage() {
  const { user } = useAuth();
  const active = useQuery({ ...activeEmergencyQuery(user?.id), refetchInterval: 10_000 });
  const contacts = useQuery(contactsQuery(user?.id));
  const history = useQuery(emergenciesQuery(user?.id));
  const resqr = useQuery(myResqrIdQuery(user?.id));

  const emergency = active.data ?? null;
  const modules = coreModules({
    emergency,
    plan: cachedPlan(emergency?.id),
    hasResqr: Boolean(resqr.data),
    contactCount: contacts.data?.length ?? 0,
    lastAccidentReport: history.data?.find((item) => Boolean(item.ai_summary)) ?? null,
  });

  return (
    <>
      <PageHeader
        icon={Cpu}
        title="RESQORA CORE"
        description="AI Emergency Coordination System — the Digital Twin, AI Coordinator, RESQR ID and Accident Response Engine, live in one view."
        actions={
          <Button asChild variant={emergency ? "emergency" : "outline"}>
            <Link to={emergency ? "/digital-twin" : "/emergency"}>
              <Siren className="size-4" aria-hidden="true" />
              {emergency ? "Open live workspace" : "Emergency SOS"}
            </Link>
          </Button>
        }
      />

      {emergency && (
        <section
          aria-label="Active emergency"
          className="glass-panel rounded-3xl border-alert/40 bg-alert/5 p-4 sm:p-5"
        >
          <p className="text-[11px] uppercase tracking-[0.16em] text-alert">Active emergency</p>
          <p className="mt-1 font-display text-xl font-bold text-foreground">
            {emergencyReference(emergency)} · {emergency.type.replace(/_/g, " ")}
          </p>
          <p className="text-xs text-muted-foreground">
            {emergency.address ?? "Location resolving…"} · started{" "}
            {new Date(emergency.started_at).toLocaleTimeString()}
          </p>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {modules.map((module) => {
          const Icon = MODULE_ICON[module.id];
          const meta = MODULE_STATE_META[module.state];
          return (
            <article key={module.id} className="glass-panel grid gap-3 rounded-3xl p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <span
                  aria-hidden="true"
                  className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary"
                >
                  <Icon className="size-5" />
                </span>
                <Badge
                  variant="outline"
                  className={`rounded-full text-[10px] font-semibold uppercase ${meta.chip}`}
                >
                  <span className={`mr-1.5 inline-block size-1.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </Badge>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">{module.name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{module.description}</p>
              </div>
              <p className="rounded-2xl border border-border/60 bg-background/60 p-3 text-xs text-foreground">
                {module.detail}
              </p>
              <Button asChild size="sm" variant="ghost" className="justify-self-start">
                <Link to={module.to}>
                  Open module
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </article>
          );
        })}
      </div>
    </>
  );
}
