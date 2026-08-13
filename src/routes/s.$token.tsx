import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BatteryMedium,
  CheckCircle2,
  Clock,
  Copy,
  Droplets,
  ExternalLink,
  Gauge,
  Link2,
  MapPin,
  Navigation,
  PhoneCall,
  ShieldAlert,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { MapPreview } from "@/components/resqora/map-preview";
import { GuardianServices } from "@/components/guardian/guardian-services";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { copyText, mapsDirectionsLink, mapsLink } from "@/lib/alerts";
import { formatDuration } from "@/lib/emergency";
import type { NearbyPlace, PlaceCategory } from "@/lib/nearby.server";

export const Route = createFileRoute("/s/$token")({
  head: () => ({
    meta: [
      { title: "Live emergency location — RESQORA" },
      {
        name: "description",
        content:
          "Follow a shared RESQORA emergency in real time. This secure link shows the person's latest GPS position and status.",
      },
      { property: "og:title", content: "Live emergency location — RESQORA" },
      {
        property: "og:description",
        content: "A secure RESQORA link with a live emergency position.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SharedLocationPage,
});

type SharedLocation = {
  full_name: string;
  user_phone: string | null;
  blood_group: string | null;
  allergies: string | null;
  medical_conditions: string | null;
  medications: string | null;
  type: string;
  severity: string;
  status: string;
  live_status: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  notes: string | null;
  started_at: string;
  resolved_at: string | null;
  duration_seconds: number | null;
  location_updated_at: string | null;
  speed: number | null;
  battery_level: number | null;
  accuracy: number | null;
  reference: string;
  timeline: { label: string; detail: string | null; created_at: string }[];
};

const LIVE_LABELS: Record<string, string> = {
  need_help: "Needs immediate help",
  help_arrived: "Help has arrived",
  safe: "Marked safe",
};

function SharedLocationPage() {
  const { token } = Route.useParams();
  const [online, setOnline] = useState(true);
  const [nearest, setNearest] = useState<Partial<Record<PlaceCategory, NearbyPlace>>>({});

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const shared = useQuery({
    queryKey: ["shared-location", token],
    refetchInterval: (query) =>
      (query.state.data as SharedLocation | null)?.resolved_at ? false : 10000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_shared_location", { _token: token });
      if (error) throw new Error(error.message);
      return (data as unknown as SharedLocation | null) ?? null;
    },
  });

  // Movement history for the same token-gated session.
  const track = useQuery({
    queryKey: ["shared-track", token],
    refetchInterval: () => (shared.data?.resolved_at ? false : 10000),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_shared_track", { _token: token });
      if (error) throw new Error(error.message);
      return (data ?? []) as {
        latitude: number;
        longitude: number;
        accuracy: number | null;
        speed: number | null;
        battery_level: number | null;
        created_at: string;
      }[];
    },
  });

  const info = shared.data;
  const coords =
    info && info.latitude != null && info.longitude != null
      ? { lat: info.latitude, lng: info.longitude }
      : null;
  const resolved = Boolean(info?.resolved_at) || info?.live_status === "safe";
  const elapsed = info
    ? (info.duration_seconds ??
      Math.round((Date.now() - new Date(info.started_at).getTime()) / 1000))
    : 0;

  async function copy(value: string, label: string) {
    await copyText(value);
    toast.success(`${label} copied`);
  }

  const details = info
    ? [
        "🚨 RESQORA Emergency Alert",
        `Person: ${info.full_name}`,
        `Status: ${resolved ? "Emergency resolved" : (LIVE_LABELS[info.live_status] ?? "Emergency active")}`,
        `Type: ${info.type}`,
        `Address: ${info.address || "Address unavailable"}`,
        `Coordinates: ${coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : "Awaiting GPS"}`,
        `Map: ${coords ? mapsLink(coords) : "Pending"}`,
        `Emergency ID: ${info.reference}`,
        `Started: ${new Date(info.started_at).toLocaleString()}`,
      ].join("\n")
    : "";

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <Logo />
        {shared.isLoading ? (
          <div className="glass-panel h-72 animate-pulse rounded-3xl" />
        ) : !info ? (
          <div className="glass-panel grid place-items-center rounded-3xl p-10 text-center">
            <ShieldAlert className="size-10 text-muted-foreground" aria-hidden="true" />
            <h1 className="mt-4 text-xl font-semibold text-foreground">
              This link is no longer active
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The person has stopped sharing their location, or the link has expired.
            </p>
          </div>
        ) : (
          <>
            <div className="glass-panel overflow-hidden rounded-3xl">
              <div className="border-b border-border p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-alert">
                  Live emergency · {info.reference}
                </p>
                <h1 className="mt-1 font-display text-2xl font-bold text-foreground">
                  {resolved ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="size-6 text-success" aria-hidden="true" />
                      {info.full_name} — Emergency resolved
                    </span>
                  ) : (
                    <>
                      {info.full_name} — {LIVE_LABELS[info.live_status] ?? "Emergency active"}
                    </>
                  )}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {info.type} emergency · started {new Date(info.started_at).toLocaleString()}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1 rounded-full text-[10px]">
                    <Clock className="size-3" aria-hidden="true" />
                    {formatDuration(elapsed)} elapsed
                  </Badge>
                  <Badge variant="outline" className="gap-1 rounded-full text-[10px]">
                    <Gauge className="size-3" aria-hidden="true" />
                    {info.speed != null
                      ? `${Math.round(info.speed * 3.6)} km/h`
                      : "Speed unavailable"}
                  </Badge>
                  <Badge variant="outline" className="gap-1 rounded-full text-[10px]">
                    <BatteryMedium className="size-3" aria-hidden="true" />
                    {info.battery_level != null
                      ? `${info.battery_level}% battery`
                      : "Battery unknown"}
                  </Badge>
                  <Badge variant="outline" className="gap-1 rounded-full text-[10px]">
                    {online ? (
                      <Wifi className="size-3" aria-hidden="true" />
                    ) : (
                      <WifiOff className="size-3" aria-hidden="true" />
                    )}
                    {online ? "You are online" : "You are offline"}
                  </Badge>
                </div>
              </div>
              <MapPreview coords={coords} title="Shared emergency location" />
              <div className="grid gap-4 border-t border-border p-5 sm:grid-cols-2">
                <Field label="Latitude" value={coords ? coords.lat.toFixed(6) : "Awaiting GPS"} />
                <Field label="Longitude" value={coords ? coords.lng.toFixed(6) : "Awaiting GPS"} />
                <Field label="Address" value={info.address || "Not provided"} />
                <Field
                  label="Emergency started"
                  value={new Date(info.started_at).toLocaleString()}
                />
                <Field
                  label="Location updated"
                  value={
                    info.location_updated_at
                      ? new Date(info.location_updated_at).toLocaleTimeString()
                      : "Waiting for first fix"
                  }
                />
                {info.blood_group && <Field label="Blood group" value={info.blood_group} />}
                {info.allergies && <Field label="Allergies" value={info.allergies} />}
                {info.medical_conditions && (
                  <Field label="Medical conditions" value={info.medical_conditions} />
                )}
                {info.medications && <Field label="Medications" value={info.medications} />}
                {info.notes && <Field label="Notes" value={info.notes} />}
                {info.resolved_at && (
                  <Field label="Resolved" value={new Date(info.resolved_at).toLocaleString()} />
                )}
              </div>
              <div className="grid gap-2 border-t border-border p-5 sm:grid-cols-2 lg:grid-cols-4">
                <Button asChild variant="hero" disabled={!info.user_phone}>
                  {info.user_phone ? (
                    <a href={`tel:${info.user_phone}`}>
                      <PhoneCall className="size-4" />
                      Call {info.full_name.split(" ")[0]}
                    </a>
                  ) : (
                    <span>
                      <PhoneCall className="size-4" />
                      No phone shared
                    </span>
                  )}
                </Button>
                <Button asChild variant="outline" disabled={!coords}>
                  {coords ? (
                    <a
                      href={mapsDirectionsLink(`${coords.lat},${coords.lng}`)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Navigation className="size-4" />
                      Navigate to them
                    </a>
                  ) : (
                    <span>
                      <Navigation className="size-4" />
                      Awaiting GPS
                    </span>
                  )}
                </Button>
                <Button variant="outline" onClick={() => copy(details, "Emergency details")}>
                  <Copy className="size-4" />
                  Copy details
                </Button>
                <Button
                  variant="outline"
                  onClick={() => copy(window.location.href, "Tracking link")}
                >
                  <Link2 className="size-4" />
                  Copy tracking link
                </Button>
              </div>
              <div className="grid gap-2 border-t border-border p-5 sm:grid-cols-2 lg:grid-cols-4">
                <ResponderButton place={nearest.hospital} label="Call nearest hospital" />
                <ResponderButton place={nearest.police} label="Call police" />
                <ResponderButton place={nearest.fire} label="Call fire station" />
                <Button asChild variant="outline">
                  <a href="#blood-banks">
                    <Droplets className="size-4" />
                    Nearby blood banks
                  </a>
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-border p-5">
                {(track.data ?? []).length > 0 && (
                  <div className="w-full">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Movement history
                    </p>
                    <ul className="mt-2 max-h-44 space-y-1 overflow-auto">
                      {(track.data ?? []).map((ping) => (
                        <li
                          key={ping.created_at}
                          className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-3 py-1.5 text-xs"
                        >
                          <span className="font-mono text-foreground">
                            {ping.latitude.toFixed(5)}, {ping.longitude.toFixed(5)}
                          </span>
                          <span className="text-muted-foreground">
                            {new Date(ping.created_at).toLocaleTimeString()}
                            {ping.accuracy ? ` · ±${Math.round(ping.accuracy)}m` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Button asChild variant="hero" disabled={!coords}>
                  {coords ? (
                    <a href={mapsLink(coords)} target="_blank" rel="noreferrer">
                      <ExternalLink className="size-4" />
                      Open in Google Maps
                    </a>
                  ) : (
                    <span>
                      <MapPin className="size-4" />
                      Waiting for GPS
                    </span>
                  )}
                </Button>
                <p className="self-center text-xs text-muted-foreground">
                  {resolved
                    ? "This emergency is closed — live updates have stopped."
                    : "This page refreshes automatically every 10 seconds."}
                </p>
              </div>
            </div>

            <section id="blood-banks" className="glass-panel rounded-3xl p-5">
              <h2 className="font-display text-lg font-bold text-foreground">
                Nearest emergency services
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Real hospitals, police, fire &amp; rescue and blood banks around their last known
                position.
              </p>
              <div className="mt-4">
                <GuardianServices
                  lat={coords?.lat ?? null}
                  lng={coords?.lng ?? null}
                  onNearest={setNearest}
                />
              </div>
            </section>

            <section className="glass-panel rounded-3xl p-5">
              <h2 className="font-display text-lg font-bold text-foreground">Emergency timeline</h2>
              {(info.timeline ?? []).length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No events recorded yet.</p>
              ) : (
                <ol className="mt-4 space-y-3">
                  {(info.timeline ?? []).map((event) => (
                    <li key={`${event.label}-${event.created_at}`} className="flex gap-3">
                      <span
                        className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{event.label}</p>
                        {event.detail && (
                          <p className="text-xs text-muted-foreground">{event.detail}</p>
                        )}
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(event.created_at).toLocaleString()}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function ResponderButton({ place, label }: { place: NearbyPlace | undefined; label: string }) {
  if (!place?.phone) {
    return (
      <Button variant="outline" disabled>
        <PhoneCall className="size-4" />
        {label}
      </Button>
    );
  }
  return (
    <Button asChild variant="outline">
      <a href={`tel:${place.phone}`}>
        <PhoneCall className="size-4" />
        {label}
      </a>
    </Button>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
