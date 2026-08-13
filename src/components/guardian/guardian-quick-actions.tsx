import {
  Flame,
  MapPin,
  Navigation,
  PhoneCall,
  Share2,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { copyText, mapsLink, mapsNavigateLink } from "@/lib/alerts";
import type { NearbyPlace } from "@/lib/nearby.server";
import type { GuardianView } from "@/lib/guardian-view";
import { handoverText } from "@/lib/guardian-handover";

/** Sticky emergency action bar — every action works on mobile and desktop. */
export function GuardianQuickActions({
  view,
  hospital,
  dashboardUrl,
}: {
  view: GuardianView;
  hospital?: NearbyPlace;
  dashboardUrl: string;
}) {
  const coords =
    view.latitude != null && view.longitude != null
      ? { lat: view.latitude, lng: view.longitude }
      : null;

  const share = async () => {
    const text = handoverText(view, dashboardUrl);
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `RESQORA emergency ${view.reference}`, text });
        return;
      } catch {
        /* dismissed — fall back to clipboard */
      }
    }
    await copyText(text);
    toast.success("Emergency summary copied");
  };

  return (
    <section className="sticky bottom-0 z-30 -mx-4 border-t border-border bg-background/90 p-3 backdrop-blur sm:mx-0 sm:rounded-3xl sm:border">
      <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        Quick actions
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {view.user_phone && (
          <Button asChild variant="emergency" size="lg" className="h-12 rounded-2xl">
            <a href={`tel:${view.user_phone}`}>
              <PhoneCall className="size-4" />
              Call {view.full_name.split(" ")[0]}
            </a>
          </Button>
        )}
        <Button asChild variant="emergency" size="lg" className="h-12 rounded-2xl">
          <a href="tel:108">
            <Stethoscope className="size-4" />
            Ambulance 108
          </a>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-12 rounded-2xl">
          <a href="tel:112">
            <ShieldCheck className="size-4" />
            Police 112
          </a>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-12 rounded-2xl">
          <a href="tel:101">
            <Flame className="size-4" />
            Fire 101
          </a>
        </Button>
        {hospital && (
          <Button asChild variant="outline" size="lg" className="h-12 rounded-2xl">
            <a href={mapsNavigateLink(hospital)} target="_blank" rel="noreferrer">
              <Navigation className="size-4" />
              To {hospital.name.split(" ").slice(0, 2).join(" ")}
            </a>
          </Button>
        )}
        {coords && (
          <Button asChild variant="outline" size="lg" className="h-12 rounded-2xl">
            <a href={mapsLink(coords)} target="_blank" rel="noreferrer">
              <MapPin className="size-4" />
              Open location
            </a>
          </Button>
        )}
        <Button variant="outline" size="lg" className="h-12 rounded-2xl" onClick={share}>
          <Share2 className="size-4" />
          Share emergency
        </Button>
      </div>
    </section>
  );
}
