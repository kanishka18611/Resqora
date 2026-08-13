import { AlertTriangle, MapPin, Navigation, Phone, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Prominent emergency card shown when RESQ AI detects a possible
 * life-threatening presentation. Wires straight into RESQORA's SOS,
 * hospital navigation and live-location sharing.
 */
export function ResqEmergencyCard({
  headline,
  detail,
  onActivateSos,
  onShareLocation,
  hospitalNavigateUrl,
}: {
  headline: string;
  detail?: string | null;
  onActivateSos?: () => void;
  onShareLocation?: () => void;
  hospitalNavigateUrl?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-alert/40 bg-alert/10 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-alert">
        <AlertTriangle className="size-4" aria-hidden="true" /> {headline}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {detail ??
          "Get emergency help now — activating SOS alerts your contacts and guardian with your live location."}
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {onActivateSos && (
          <Button
            size="sm"
            variant="destructive"
            className="h-11 rounded-xl"
            onClick={onActivateSos}
          >
            <Siren className="size-4" /> Activate SOS
          </Button>
        )}
        <Button asChild size="sm" variant="outline" className="h-11 rounded-xl">
          <a href="tel:108">
            <Phone className="size-4" /> Call 108
          </a>
        </Button>
        {hospitalNavigateUrl && (
          <Button asChild size="sm" variant="outline" className="h-11 rounded-xl">
            <a href={hospitalNavigateUrl} target="_blank" rel="noreferrer">
              <Navigation className="size-4" /> Nearest emergency hospital
            </a>
          </Button>
        )}
        {onShareLocation && (
          <Button size="sm" variant="outline" className="h-11 rounded-xl" onClick={onShareLocation}>
            <MapPin className="size-4" /> Share live location
          </Button>
        )}
      </div>
    </div>
  );
}
