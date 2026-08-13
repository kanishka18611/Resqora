import { Building2, Clock, Loader2, Navigation, PhoneCall, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SPECIALTY_META, rankBySpecialty, type HospitalSpecialty } from "@/lib/accident";
import type { NearbyPlace } from "@/lib/nearby.server";
import { mapsClickHandler, mapsHref } from "@/lib/maps";

/** Top 3 real hospitals able to handle the detected emergency. */
export function HospitalShortlist({
  hospitals,
  specialty,
  loading,
  onCall,
  onNavigate,
}: {
  hospitals: NearbyPlace[];
  specialty: HospitalSpecialty;
  loading: boolean;
  onCall?: (place: NearbyPlace) => void;
  onNavigate?: (place: NearbyPlace) => void;
}) {
  const meta = SPECIALTY_META[specialty];
  const top = rankBySpecialty(hospitals, specialty).slice(0, 3);

  return (
    <section aria-label="Recommended hospitals" className="glass-panel rounded-3xl p-4 sm:p-5">
      <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
        <Building2 className="size-4 text-primary" aria-hidden="true" />
        {meta.label} — nearest 3
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{meta.note}</p>

      {loading && top.length === 0 ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Locating emergency-capable hospitals…
        </p>
      ) : top.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No hospital found nearby yet — call an ambulance on 108 straight away.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {top.map((place) => (
            <li key={place.id} className="rounded-2xl border border-border/60 bg-card/60 p-3">
              <p className="text-sm font-semibold text-foreground">{place.name}</p>
              {place.address && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{place.address}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Route className="size-3.5" aria-hidden="true" />
                  {place.distanceKm.toFixed(1)} km
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" aria-hidden="true" />
                  ETA ~{place.etaMinutes} min
                </span>
                <span
                  className={
                    place.openNow === false
                      ? "font-medium text-warning"
                      : place.openNow
                        ? "font-medium text-success"
                        : ""
                  }
                >
                  {place.openNow === true
                    ? "Emergency dept. open"
                    : place.openNow === false
                      ? "Hours unconfirmed — call first"
                      : "Availability not published"}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  asChild
                  size="sm"
                  variant={place.phone ? "default" : "outline"}
                  disabled={!place.phone}
                  className="h-11 flex-1 rounded-xl"
                  onClick={() => onCall?.(place)}
                >
                  <a href={place.phone ? `tel:${place.phone}` : "#"}>
                    <PhoneCall className="size-4" aria-hidden="true" />
                    Call
                  </a>
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-11 flex-1 rounded-xl"
                  onClick={() => onNavigate?.(place)}
                >
                  <a
                    href={mapsHref(place, "navigate")}
                    onClick={mapsClickHandler(place, "navigate")}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Navigation className="size-4" aria-hidden="true" />
                    Navigate
                  </a>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
