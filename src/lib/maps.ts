/**
 * Google Maps deep-link helpers.
 *
 * Only the officially supported Maps URL scheme is used, so links open the real
 * Maps app on Android and iOS and the Maps website on desktop — never a blocked
 * or unauthenticated Google endpoint. When a place has no usable coordinates the
 * address is geocoded first, so navigation is never opened with a blank target.
 */
import { hasCoords } from "@/lib/alerts";
import { geocodeAddress } from "@/lib/nearby.functions";

export type MapTarget = {
  lat?: number | null;
  lng?: number | null;
  name?: string | null;
  address?: string | null;
};

export function navigationUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}

export function viewUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/** Direct URL when coordinates are known, otherwise null (geocode first). */
export function targetUrl(target: MapTarget, mode: "navigate" | "view") {
  if (!hasCoords(target)) return null;
  const lat = target.lat as number;
  const lng = target.lng as number;
  return mode === "navigate" ? navigationUrl(lat, lng) : viewUrl(lat, lng);
}

/** Resolves a target to coordinates, geocoding the address when needed. */
async function resolveTarget(target: MapTarget) {
  if (hasCoords(target)) return { lat: target.lat as number, lng: target.lng as number };
  const query = [target.name, target.address].filter(Boolean).join(", ").trim();
  if (query.length < 2) return null;
  try {
    const hit = await geocodeAddress({ data: { query: query.slice(0, 160) } });
    if (hit && Number.isFinite(hit.lat) && Number.isFinite(hit.lng)) {
      return { lat: hit.lat, lng: hit.lng };
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Click handler for a Maps anchor. Coordinate-backed links follow their href
 * natively; address-only places are geocoded and then opened in a tab that was
 * created inside the user gesture so no popup blocker interferes.
 */
export function mapsClickHandler(target: MapTarget, mode: "navigate" | "view") {
  return (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (hasCoords(target)) return;
    event.preventDefault();
    const tab = window.open("", "_blank", "noopener,noreferrer");
    void resolveTarget(target).then((coords) => {
      const url = coords
        ? mode === "navigate"
          ? navigationUrl(coords.lat, coords.lng)
          : viewUrl(coords.lat, coords.lng)
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            [target.name, target.address].filter(Boolean).join(", ") || "hospital near me",
          )}`;
      if (tab) tab.location.href = url;
      else window.location.href = url;
    });
  };
}

/** Safe href for a Maps anchor — falls back to a name/address query. */
export function mapsHref(target: MapTarget, mode: "navigate" | "view") {
  const direct = targetUrl(target, mode);
  if (direct) return direct;
  const query = [target.name, target.address].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || "hospital near me")}`;
}
