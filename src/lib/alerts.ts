import type { Emergency, EmergencyContact, Profile } from "@/lib/api";

export type Coords = { lat: number; lng: number };

export function coordsOf(emergency: Emergency | null | undefined): Coords | null {
  if (!emergency || emergency.latitude == null || emergency.longitude == null) return null;
  return { lat: emergency.latitude, lng: emergency.longitude };
}

export function mapsLink(coords: Coords) {
  return `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
}

export function mapsDirectionsLink(destination: string, origin?: Coords | null) {
  const params = new URLSearchParams({ api: "1", destination });
  if (origin) params.set("origin", `${origin.lat},${origin.lng}`);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** True when a place has usable, non-placeholder coordinates. */
export function hasCoords(place: { lat?: number | null; lng?: number | null } | null | undefined) {
  if (!place) return false;
  const { lat, lng } = place;
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

/**
 * Turn-by-turn navigation to a destination place. The device's live position is
 * always the starting point, so this never navigates *to* the user.
 */
export function mapsNavigateLink(place: { lat: number; lng: number; name?: string | null }) {
  return `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&travelmode=driving`;
}

/** Opens the selected place on Google Maps (never a blank map). */
export function mapsPlaceLink(place: { lat: number; lng: number; name?: string | null }) {
  return `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
}

/**
 * Embeddable map. Uses the official Maps Embed API when the browser key is
 * available (the legacy `output=embed` endpoint is blocked by Google), and an
 * OpenStreetMap embed otherwise, so a map always renders.
 */
export function mapsEmbedUrl(coords: Coords, zoom = 16) {
  const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
  if (key) {
    return `https://www.google.com/maps/embed/v1/view?key=${key}&center=${coords.lat},${coords.lng}&zoom=${zoom}&maptype=roadmap`;
  }
  const d = 0.008;
  const bbox = `${coords.lng - d},${coords.lat - d},${coords.lng + d},${coords.lat + d}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords.lat},${coords.lng}`;
}

/**
 * Builds the alert body delivered to a trusted contact. Channels (SMS, WhatsApp,
 * email) are simulated for now — this single payload is what a real provider
 * integration would send.
 */
export function buildAlertMessage(input: {
  contact: EmergencyContact;
  profile: Profile | null | undefined;
  emergency: Emergency;
}) {
  const { contact, profile, emergency } = input;
  const coords = coordsOf(emergency);
  const started = new Date(emergency.started_at);
  const lines = [
    `EMERGENCY ALERT — RESQORA`,
    ``,
    `${contact.name}, you are listed as a trusted contact for ${profile?.full_name || "an RESQORA user"}.`,
    ``,
    `Person: ${profile?.full_name || "Unknown"}${profile?.blood_group ? ` (blood group ${profile.blood_group})` : ""}`,
    `Type: ${emergency.type} emergency`,
    `Time: ${started.toLocaleString()}`,
    `Address: ${emergency.address || profile?.home_address || "Address unavailable"}`,
    `Coordinates: ${coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : "Awaiting GPS"}`,
    `Map: ${coords ? mapsLink(coords) : "Pending location capture"}`,
    `Status: ${emergency.status.replace(/_/g, " ")}`,
    `Reference: ${emergency.id.slice(0, 8).toUpperCase()}`,
  ];
  if (emergency.notes) lines.push(`Notes: ${emergency.notes}`);
  lines.push(``, `Please call them now or contact local emergency services.`);
  return lines.join("\n");
}

export const alertChannels = [
  { id: "sms", label: "SMS" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "email", label: "Email" },
] as const;

export async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

export async function shareText(title: string, text: string) {
  if (typeof navigator !== "undefined" && "share" in navigator) {
    try {
      await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({
        title,
        text,
      });
      return true;
    } catch {
      return false;
    }
  }
  await copyText(text);
  return false;
}
