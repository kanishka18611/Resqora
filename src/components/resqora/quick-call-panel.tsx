import { Ambulance, Flame, Hospital, PhoneCall, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EmergencyContact } from "@/lib/api";
import { EMERGENCY_LINE } from "@/lib/coordination";
import type { NearbyResult } from "@/hooks/use-nearby-services";

type CallTarget = {
  key: string;
  label: string;
  detail: string;
  phone: string;
  icon: typeof PhoneCall;
  tone: "contact" | "service";
};

/**
 * One-tap dialler. Every button only opens the device dialer — RESQORA never
 * places a call itself, so no telephony provider is involved.
 */
export function QuickCallPanel({
  contacts,
  nearby,
  ambulanceNumber = EMERGENCY_LINE.phone,
}: {
  contacts: EmergencyContact[];
  nearby?: NearbyResult;
  ambulanceNumber?: string;
}) {
  const service = (
    key: keyof NearbyResult,
    label: string,
    icon: typeof PhoneCall,
  ): CallTarget | null => {
    const place = nearby?.[key]?.find((p) => p.phone);
    if (!place?.phone) return null;
    return {
      key,
      label,
      detail: `${place.name} · ${place.distanceKm.toFixed(1)} km`,
      phone: place.phone,
      icon,
      tone: "service",
    };
  };

  const targets: CallTarget[] = [
    ...contacts.slice(0, 3).map((contact, index) => ({
      key: contact.id,
      label: `Emergency contact ${index + 1}`,
      detail: `${contact.name} · ${contact.relationship}`,
      phone: contact.phone,
      icon: Users,
      tone: "contact" as const,
    })),
    service("hospital", "Nearest hospital", Hospital),
    service("police", "Nearest police station", Shield),
    service("fire", "Nearest fire station", Flame),
    {
      key: "ambulance-line",
      label: "National ambulance number",
      detail: EMERGENCY_LINE.name,
      phone: ambulanceNumber,
      icon: Ambulance,
      tone: "service",
    },
  ].filter(Boolean) as CallTarget[];

  return (
    <section className="rounded-2xl border border-border bg-card/60 p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <PhoneCall className="size-4 text-alert" aria-hidden="true" />
        Quick call panel
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        One tap opens your phone's dialler with the number ready.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {targets.map((target) => (
          <Button
            key={target.key}
            asChild
            variant={target.tone === "contact" ? "hero" : "outline"}
            className="h-auto justify-start py-3 text-left"
          >
            <a href={`tel:${target.phone.replace(/[^\d+]/g, "")}`}>
              <target.icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{target.label}</span>
                <span className="block truncate text-[11px] font-normal opacity-80">
                  {target.detail}
                </span>
              </span>
            </a>
          </Button>
        ))}
      </div>
    </section>
  );
}
