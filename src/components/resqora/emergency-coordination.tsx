import { useState } from "react";
import { PhoneCall, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlaceCard, CATEGORY_EMOJI, CATEGORY_LABEL } from "@/components/resqora/nearest-services";
import { EMERGENCY_LINE, coordinationCategories } from "@/lib/coordination";
import { useNearbyServices } from "@/hooks/use-nearby-services";
import type { NearbyPlace, PlaceCategory } from "@/lib/nearby.server";
import type { LivePosition } from "@/hooks/use-live-position";

/**
 * During an active SOS this picks the nearest real service for every category
 * the incident type requires, with alternates one tap away.
 */
export function EmergencyCoordination({
  type,
  severity,
  position,
  status,
  nearby,
}: {
  type: string;
  severity?: string | null;
  position: LivePosition | null;
  status?: string;
  nearby?: ReturnType<typeof useNearbyServices>;
}) {
  const fallback = useNearbyServices(nearby ? null : position);
  const state = nearby ?? fallback;
  const [showMore, setShowMore] = useState(false);

  const categories: PlaceCategory[] = coordinationCategories(type, severity);

  return (
    <section aria-label="Emergency coordination" className="glass-panel rounded-2xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <Radio className="size-4 text-primary" aria-hidden="true" />
          Emergency coordination
        </h2>
        <Badge variant="secondary" className="rounded-full text-[10px] font-semibold uppercase">
          {status ?? "Coordinating"}
        </Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Nearest responders automatically selected for a {type.replace(/_/g, " ")} emergency
        {severity ? ` · ${severity} severity` : ""}.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {categories.map((category) => {
          const places = state.data[category];
          const primary = places[0];
          const alternates = showMore ? places.slice(1) : [];
          return (
            <div key={category} className="grid gap-2">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {CATEGORY_EMOJI[category]} Nearest {CATEGORY_LABEL[category].toLowerCase()}
              </p>
              {primary ? (
                <>
                  <PlaceCard place={primary} origin={state.origin} />
                  {alternates.map((place: NearbyPlace, index: number) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      origin={state.origin}
                      rank={index + 2}
                    />
                  ))}
                </>
              ) : (
                <p className="rounded-2xl border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
                  {state.isLoading ? "Locating…" : "No nearby services found."}
                </p>
              )}
            </div>
          );
        })}

        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 p-3">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-alert/10 text-alert"
          >
            <PhoneCall className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Public emergency line
            </p>
            <p className="truncate text-sm font-semibold text-foreground">{EMERGENCY_LINE.name}</p>
            <p className="text-xs text-muted-foreground">{EMERGENCY_LINE.phone}</p>
          </div>
          <Button
            asChild
            size="icon"
            variant="emergency"
            aria-label="Call the public emergency line"
          >
            <a href={`tel:${EMERGENCY_LINE.phone}`}>
              <PhoneCall className="size-4" />
            </a>
          </Button>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="mt-3 w-full text-xs"
        onClick={() => setShowMore((value) => !value)}
      >
        {showMore ? "Hide extra options" : "More nearby options"}
      </Button>
    </section>
  );
}
