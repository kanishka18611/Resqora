import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, ExternalLink, Loader2, Radar, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/system/page-header";
import { StatusIndicator } from "@/components/system/status-indicator";
import { EmptyState } from "@/components/system/empty-state";
import { PanelSkeleton } from "@/components/system/loading-skeletons";
import { MapPreview } from "@/components/resqora/map-preview";
import { ContactAlertStatus } from "@/components/resqora/contact-alert-status";
import { EmergencyAnalysisPanel } from "@/components/resqora/emergency-analysis";
import { EmergencyChecklist } from "@/components/resqora/emergency-checklist";
import { ImSafeButton } from "@/components/resqora/im-safe-button";
import { MedicalIdCard } from "@/components/resqora/medical-id-card";
import { ShareSos } from "@/components/resqora/share-sos";
import { LiveStatusControls } from "@/components/resqora/live-status-controls";
import { EmergencyCoordination } from "@/components/resqora/emergency-coordination";
import { useLivePosition } from "@/hooks/use-live-position";
import { readBatteryLevel, readSpeed } from "@/lib/device";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { ensureLiveShareLink, shareUrl } from "@/lib/share";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  activeEmergencyQuery,
  contactsQuery,
  emergencyEventsQuery,
  getCurrentPosition,
  logEvent,
  profileQuery,
} from "@/lib/api";
import { coordsOf, copyText, mapsLink } from "@/lib/alerts";
import { formatDuration, statusLabel } from "@/lib/emergency";

export const Route = createFileRoute("/_app/live")({
  head: () => ({
    meta: [
      { title: "Live location — RESQORA" },
      {
        name: "description",
        content:
          "Follow an active RESQORA emergency in real time: live GPS coordinates, responder status and the full alert timeline.",
      },
      { property: "og:title", content: "RESQORA Live Location" },
      { property: "og:description", content: "Real-time coordinates and responder progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LiveLocationPage,
});

function LiveLocationPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const active = useQuery(activeEmergencyQuery(user?.id));
  const events = useQuery(emergencyEventsQuery(active.data?.id));
  const contacts = useQuery(contactsQuery(user?.id));
  const profile = useQuery(profileQuery(user?.id));
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { position, address, denied } = useLivePosition();
  const [elapsed, setElapsed] = useState(0);
  const { offline, pending } = useOfflineSync();
  const [showMedicalId, setShowMedicalId] = useState(false);

  const emergency = active.data;
  const coords = coordsOf(emergency);
  const emergencyId = emergency?.id;
  const startedAt = emergency?.started_at;

  const shareLink = useQuery({
    queryKey: ["live-share-link", emergencyId],
    enabled: Boolean(user?.id && emergencyId),
    queryFn: async () => ensureLiveShareLink(user!.id, emergencyId!),
  });
  const trackingUrl = shareLink.data && shareLink.data.active ? shareUrl(shareLink.data) : null;

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0);
      return;
    }
    const begin = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.max(0, Math.round((Date.now() - begin) / 1000)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);

  const refreshLocation = useCallback(
    async (options: { silent?: boolean; log?: boolean } = {}) => {
      if (!emergencyId || !user) return;
      setRefreshing(true);
      try {
        const position = await getCurrentPosition();
        await supabase
          .from("emergencies")
          .update({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            location_updated_at: new Date().toISOString(),
          })
          .eq("id", emergencyId);
        await supabase.from("location_pings").insert({
          emergency_id: emergencyId,
          user_id: user.id,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: readSpeed(position.coords),
          battery_level: await readBatteryLevel(),
        });
        if (options.log !== false) {
          await logEvent(
            emergencyId,
            user.id,
            "Location updated",
            `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`,
          );
        }
        await queryClient.invalidateQueries({ queryKey: ["active-emergency", user.id] });
        setUpdatedAt(new Date());
        if (!options.silent) toast.success("Location refreshed");
      } catch {
        if (!options.silent) toast.error("Could not read your GPS position");
      } finally {
        setRefreshing(false);
      }
    },
    [emergencyId, user, queryClient],
  );

  // The app-wide emergency tracker (see useEmergencyTracker) already writes a
  // fresh fix every 10s, so this page only refreshes on demand — running both
  // would double every location write.

  async function copyCoords() {
    if (!coords) return;
    await copyText(`${coords.lat}, ${coords.lng}`);
    toast.success("Coordinates copied");
  }

  return (
    <>
      <PageHeader
        icon={Radar}
        title="Live location"
        description="Real-time coordinates shared with your contacts and assigned responders."
        actions={
          emergency ? (
            <StatusIndicator status="critical" label={statusLabel(emergency.status)} pulse />
          ) : (
            <StatusIndicator status="safe" label="No active alert" />
          )
        }
      />

      {active.isLoading ? (
        <PanelSkeleton rows={3} />
      ) : !emergency ? (
        <EmptyState
          icon={Radar}
          title="Nothing to track right now"
          description="Live coordinates appear here the moment an emergency is active."
          action={
            <Button asChild variant="hero">
              <Link to="/emergency">Open emergency console</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="glass-panel overflow-hidden rounded-3xl">
            {offline && (
              <div className="flex items-center gap-2 border-b border-border bg-warning/10 px-5 py-3 text-xs font-medium text-warning">
                <WifiOff className="size-4" aria-hidden="true" />
                Offline — {pending} update{pending === 1 ? "" : "s"} saved on this device and will
                sync automatically.
              </div>
            )}
            <MapPreview coords={coords} />
            <div className="border-b border-border p-5">
              <ImSafeButton
                emergency={emergency}
                profile={profile.data}
                contacts={contacts.data ?? []}
              />
            </div>
            <div className="grid gap-4 border-t border-border p-5 sm:grid-cols-2">
              <Detail label="Latitude" value={coords ? coords.lat.toFixed(6) : "Unavailable"} />
              <Detail label="Longitude" value={coords ? coords.lng.toFixed(6) : "Unavailable"} />
              <Detail
                label="Live location status"
                value={coords ? "Sharing — auto refresh every 10s" : "Waiting for GPS permission"}
              />
              <Detail
                label="Last updated"
                value={
                  refreshing
                    ? "Updating…"
                    : updatedAt
                      ? updatedAt.toLocaleTimeString()
                      : new Date(emergency.started_at).toLocaleTimeString()
                }
              />
            </div>
            <div className="flex flex-wrap gap-2 border-t border-border p-5">
              <Button variant="hero" onClick={() => refreshLocation()} disabled={refreshing}>
                <RefreshCcw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh GPS
              </Button>
              <Button variant="outline" onClick={copyCoords} disabled={!coords}>
                <Copy className="size-4" />
                Copy location
              </Button>
              <Button variant="outline" disabled={!coords} asChild={Boolean(coords)}>
                {coords ? (
                  <a href={mapsLink(coords)} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" />
                    Open in Google Maps
                  </a>
                ) : (
                  <span>
                    <ExternalLink className="size-4" />
                    Open in Google Maps
                  </span>
                )}
              </Button>
            </div>
            <div className="border-t border-border p-5">
              <h2 className="text-sm font-semibold text-foreground">Emergency status</h2>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <Detail
                  label="Current address"
                  value={
                    denied
                      ? "Add your address to continue"
                      : (emergency.address ?? address ?? "Resolving address…")
                  }
                />
                <Detail label="Emergency duration" value={formatDuration(elapsed)} />
                <Detail
                  label="Live status"
                  value={(
                    (emergency as typeof emergency & { live_status?: string }).live_status ??
                    "need_help"
                  ).replace(/_/g, " ")}
                />
                <Detail
                  label="Last location update"
                  value={
                    updatedAt
                      ? updatedAt.toLocaleTimeString()
                      : position
                        ? position.updatedAt.toLocaleTimeString()
                        : "—"
                  }
                />
              </dl>
              <p className="mt-1 text-xs text-muted-foreground">
                Update everyone tracking this emergency instantly.
              </p>
              <div className="mt-4">
                <LiveStatusControls emergency={emergency} />
              </div>
            </div>
            <div className="border-t border-border p-5">
              <EmergencyAnalysisPanel emergency={emergency} />
            </div>
            <div className="border-t border-border p-5">
              <EmergencyChecklist type={emergency.type} />
            </div>
            <div className="border-t border-border p-5">
              <EmergencyCoordination
                type={emergency.type}
                severity={emergency.severity}
                position={position}
                status={statusLabel(emergency.status)}
              />
            </div>
            <div className="border-t border-border p-5">
              <h2 className="text-sm font-semibold text-foreground">Share SOS</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Send your live location through WhatsApp, SMS or email.
              </p>
              <div className="mt-4">
                <ShareSos
                  emergency={emergency}
                  profile={profile.data}
                  contacts={contacts.data ?? []}
                />
              </div>
            </div>
            <div className="border-t border-border p-5">
              <h2 className="text-sm font-semibold text-foreground">Contact alerts</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Every trusted contact receives your name, address, live tracking link, time and
                emergency ID. Delivery status is tracked per contact.
              </p>
              <div className="mt-4">
                <ContactAlertStatus
                  emergency={emergency}
                  profile={profile.data}
                  contacts={contacts.data ?? []}
                  trackingUrl={trackingUrl}
                  address={emergency.address ?? address}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-panel rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-foreground">Medical ID</h2>
                <Button size="sm" variant="outline" onClick={() => setShowMedicalId((v) => !v)}>
                  {showMedicalId ? "Hide" : "Show"}
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                One tap to show blood group, allergies, conditions and medications to responders.
              </p>
              {showMedicalId && (
                <div className="mt-4">
                  <MedicalIdCard profile={profile.data} contacts={contacts.data ?? []} />
                </div>
              )}
            </div>

            <div className="glass-panel rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-foreground">Alert timeline</h2>
              {events.isLoading ? (
                <Loader2 className="mt-4 size-4 animate-spin text-muted-foreground" />
              ) : (
                <ol className="mt-4 space-y-4">
                  {(events.data ?? []).map((event) => (
                    <li key={event.id} className="flex gap-3">
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-alert" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{event.label}</p>
                        {event.detail && (
                          <p className="text-xs text-muted-foreground">{event.detail}</p>
                        )}
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {new Date(event.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="glass-panel rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-foreground">Sharing with</h2>
              <ul className="mt-3 space-y-2">
                {(contacts.data ?? []).map((contact) => (
                  <li key={contact.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-foreground">{contact.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{contact.phone}</span>
                  </li>
                ))}
                {(contacts.data?.length ?? 0) === 0 && (
                  <li className="text-sm text-muted-foreground">No contacts configured.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Detail({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-medium text-foreground ${className ?? ""}`}>{value}</p>
    </div>
  );
}
