import { Copy, MapPin, Navigation } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { copyText, mapsEmbedUrl, mapsLink, mapsNavigateLink } from "@/lib/alerts";
import { guardianEnded, movementOf, type GuardianView } from "@/lib/guardian-view";

/** Live Google map plus the real GPS telemetry behind it. */
export function GuardianMap({ view }: { view: GuardianView }) {
  const coords =
    view.latitude != null && view.longitude != null
      ? { lat: view.latitude, lng: view.longitude }
      : null;
  const latest = view.track[0];
  const movement = movementOf(view.track);
  const ended = guardianEnded(view);

  return (
    <section className="glass-panel overflow-hidden rounded-3xl">
      <div className="flex items-center justify-between gap-2 p-4 pb-3">
        <h2 className="font-display text-lg font-bold">Live location</h2>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {ended ? (
            "Live updates stopped"
          ) : (
            <>
              <span className="pulse-ring size-2 rounded-full bg-alert" aria-hidden="true" />
              Refreshing every 5s
            </>
          )}
        </span>
      </div>

      {coords ? (
        <iframe
          title={`Live location of ${view.full_name}`}
          src={mapsEmbedUrl(coords)}
          className="h-72 w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <p className="px-4 pb-4 text-sm text-muted-foreground">Waiting for the first GPS fix.</p>
      )}

      <dl className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
        <Item label="Address" value={view.address ?? "Resolving…"} />
        <Item label="Latitude" value={coords ? coords.lat.toFixed(6) : "—"} />
        <Item label="Longitude" value={coords ? coords.lng.toFixed(6) : "—"} />
        <Item
          label="Accuracy"
          value={latest?.accuracy != null ? `±${Math.round(latest.accuracy)} m` : "—"}
        />
        <Item
          label="Movement"
          value={
            movement.speedKmh != null
              ? `${movement.label} · ${movement.speedKmh} km/h`
              : movement.label
          }
        />
        <Item
          label="Last GPS update"
          value={
            latest?.created_at
              ? new Date(latest.created_at).toLocaleTimeString()
              : view.location_updated_at
                ? new Date(view.location_updated_at).toLocaleTimeString()
                : "—"
          }
        />
      </dl>

      <div className="flex flex-wrap gap-2 px-4 pb-4">
        {coords && (
          <>
            <Button asChild variant="outline" size="sm">
              <a href={mapsLink(coords)} target="_blank" rel="noreferrer">
                <MapPin className="size-4" />
                Open in Google Maps
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={mapsNavigateLink(coords)} target="_blank" rel="noreferrer">
                <Navigation className="size-4" />
                Navigate
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await copyText(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
                toast.success("Coordinates copied");
              }}
            >
              <Copy className="size-4" />
              Copy coordinates
            </Button>
          </>
        )}
        {view.address && (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await copyText(view.address!);
              toast.success("Address copied");
            }}
          >
            <Copy className="size-4" />
            Copy address
          </Button>
        )}
      </div>
    </section>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card/70 p-3">
      <dt className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold">{value}</dd>
    </div>
  );
}
