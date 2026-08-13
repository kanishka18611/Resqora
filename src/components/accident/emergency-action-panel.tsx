import { Loader2, MapPin, Navigation, PhoneCall, Share2, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EMERGENCY_NUMBERS } from "@/lib/accident";
import type { NearbyPlace } from "@/lib/nearby.server";
import { mapsNavigateLink } from "@/lib/alerts";

/** One-tap emergency actions, shown for serious and critical incidents. */
export function EmergencyActionPanel({
  hospital,
  sosActive,
  sosBusy,
  sharing,
  onActivateSos,
  onShareLocation,
}: {
  hospital: NearbyPlace | null;
  sosActive: boolean;
  sosBusy: boolean;
  sharing: boolean;
  onActivateSos: () => void;
  onShareLocation: () => void;
}) {
  return (
    <section
      aria-label="Emergency action panel"
      className="rounded-3xl border border-alert/60 bg-alert/5 p-4 sm:p-5"
    >
      <h2 className="text-base font-bold text-foreground">Emergency actions</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        High severity detected — every action below is a single tap.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {EMERGENCY_NUMBERS.map((line) => (
          <Button
            key={line.key}
            asChild
            className="h-16 rounded-2xl bg-alert text-base font-bold text-alert-foreground hover:bg-alert/90"
          >
            <a href={`tel:${line.phone}`}>
              <PhoneCall className="size-5" aria-hidden="true" />
              {line.emoji} Call {line.label} ({line.phone})
            </a>
          </Button>
        ))}

        <Button
          asChild
          variant="outline"
          disabled={!hospital}
          className="soft-card h-16 rounded-2xl text-base font-bold"
        >
          <a
            href={hospital ? mapsNavigateLink(hospital) : "#"}
            target="_blank"
            rel="noreferrer noopener"
          >
            <Navigation className="size-5" aria-hidden="true" />
            🏥 {hospital ? `Navigate — ${hospital.name}` : "Finding nearest hospital…"}
          </a>
        </Button>

        <Button
          variant="outline"
          disabled={sosBusy || sosActive}
          onClick={onActivateSos}
          className="soft-card h-16 rounded-2xl text-base font-bold"
        >
          {sosBusy ? (
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          ) : (
            <Siren className="size-5" aria-hidden="true" />
          )}
          {sosActive ? "🚨 SOS active" : "🚨 Activate SOS"}
        </Button>

        <Button
          variant="outline"
          disabled={sharing}
          onClick={onShareLocation}
          className="soft-card h-16 rounded-2xl text-base font-bold sm:col-span-2"
        >
          {sharing ? (
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          ) : (
            <Share2 className="size-5" aria-hidden="true" />
          )}
          📍 Share live location
          <MapPin className="size-4 opacity-60" aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}
