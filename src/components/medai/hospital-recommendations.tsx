import { Loader2, MapPin, Navigation, Phone, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mapsClickHandler, mapsHref } from "@/lib/maps";
import type { NearbyPlace } from "@/lib/nearby.server";

/** India's ambulance / hospital emergency line, used when a facility has no verified number. */
const FALLBACK_NUMBER = "108";

/**
 * Hospitals near the user that can handle the recommended specialist care,
 * with one working Call button and turn-by-turn navigation to the hospital.
 */
export function HospitalRecommendations({
  hospitals,
  specialist,
  loading,
}: {
  hospitals: NearbyPlace[];
  specialist: string | null;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <p className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card/60 p-3 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Finding nearby hospitals…
      </p>
    );
  }
  if (hospitals.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-3">
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <Stethoscope className="size-4" aria-hidden="true" />
        {specialist ? `Hospitals for ${specialist} care` : "Nearby hospitals"}
      </p>
      <ul className="space-y-2">
        {hospitals.slice(0, 3).map((hospital) => (
          <li key={hospital.id} className="rounded-xl border border-border/50 bg-background/60 p-3">
            <p className="text-sm font-semibold">{hospital.name}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{hospital.address}</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {hospital.distanceKm.toFixed(1)} km · ~{hospital.etaMinutes} min drive
            </p>
            <div className="mt-2.5 flex gap-2">
              <Button asChild size="sm" className="h-10 flex-1">
                <a href={`tel:${hospital.phone ?? FALLBACK_NUMBER}`}>
                  <Phone className="size-4" /> Call
                </a>
              </Button>
              <Button asChild size="sm" variant="outline" className="h-10 flex-1">
                <a
                  href={mapsHref(hospital, "navigate")}
                  onClick={mapsClickHandler(hospital, "navigate")}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Navigation className="size-4" /> Navigate
                </a>
              </Button>
              <Button asChild size="icon" variant="outline" className="size-10 shrink-0">
                <a
                  href={mapsHref(hospital, "view")}
                  onClick={mapsClickHandler(hospital, "view")}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${hospital.name} on Google Maps`}
                >
                  <MapPin className="size-4" />
                </a>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
