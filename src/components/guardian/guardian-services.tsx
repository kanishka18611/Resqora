import { useEffect } from "react";
import { Droplets, Flame, Navigation, PhoneCall, ShieldCheck, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { mapsNavigateLink, mapsPlaceLink } from "@/lib/alerts";
import type { NearbyPlace, PlaceCategory } from "@/lib/nearby.server";
import { useNearbyServices } from "@/hooks/use-nearby-services";

const CATEGORIES: { key: PlaceCategory; label: string; emoji: string; icon: typeof Stethoscope }[] =
  [
    { key: "hospital", label: "Hospitals", emoji: "🏥", icon: Stethoscope },
    { key: "police", label: "Police stations", emoji: "🚓", icon: ShieldCheck },
    { key: "fire", label: "Fire & rescue", emoji: "🚒", icon: Flame },
    { key: "blood_bank", label: "Blood banks", emoji: "🩸", icon: Droplets },
  ];

/**
 * Top 3 real nearby responders per category, anchored to the user's live GPS
 * fix so the Guardian can dial or navigate in one tap.
 */
export function GuardianServices({
  lat,
  lng,
  onNearest,
}: {
  lat: number | null;
  lng: number | null;
  onNearest?: (services: Partial<Record<PlaceCategory, NearbyPlace>>) => void;
}) {
  const position =
    lat != null && lng != null
      ? { lat, lng, accuracy: 0, updatedAt: new Date(), source: "gps" as const }
      : null;
  const nearby = useNearbyServices(position);

  useEffect(() => {
    if (!onNearest) return;
    const nearest: Partial<Record<PlaceCategory, NearbyPlace>> = {};
    for (const category of CATEGORIES) {
      const first = nearby.data[category.key]?.[0];
      if (first) nearest[category.key] = first;
    }
    onNearest(nearest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearby.data]);

  if (!position) {
    return (
      <p className="text-sm text-muted-foreground">
        Waiting for the first GPS fix before listing nearby responders.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {CATEGORIES.map((category) => {
        const places = (nearby.data[category.key] ?? []).slice(0, 3);
        return (
          <div key={category.key} className="rounded-2xl border bg-card/60 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <span aria-hidden="true">{category.emoji}</span>
              {category.label}
            </p>
            {nearby.isLoading && places.length === 0 ? (
              <div className="mt-3 space-y-2">
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
              </div>
            ) : places.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                No {category.label.toLowerCase()} found within range.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {places.map((place) => (
                  <li
                    key={`${place.name}-${place.lat}-${place.lng}`}
                    className="rounded-xl bg-background/70 p-3"
                  >
                    <p className="text-sm font-semibold">{place.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {place.address || "Address unavailable"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {place.distanceKm.toFixed(1)} km · ~{place.etaMinutes} min
                      {place.phone ? ` · ${place.phone}` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {place.phone && (
                        <Button asChild size="sm" variant="outline">
                          <a href={`tel:${place.phone}`}>
                            <PhoneCall className="size-4" />
                            Call
                          </a>
                        </Button>
                      )}
                      <Button asChild size="sm" variant="outline">
                        <a href={mapsNavigateLink(place)} target="_blank" rel="noreferrer">
                          <Navigation className="size-4" />
                          Navigate
                        </a>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <a href={mapsPlaceLink(place)} target="_blank" rel="noreferrer">
                          Map
                        </a>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
