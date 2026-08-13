import { nearbyServices, type NearbyService, type ServiceCategory } from "@/lib/nearby-services";

export type GeoPoint = { lat: number; lng: number };

export type LocatedService = NearbyService & {
  coords: GeoPoint;
  distanceKm: number;
  etaMinutes: number;
};

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: GeoPoint, b: GeoPoint) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Rough urban driving ETA: ~26 km/h plus a short dispatch buffer. */
export function etaMinutes(distanceKm: number) {
  return Math.max(2, Math.round((distanceKm / 26) * 60) + 2);
}

/** Stable pseudo-random bearing per service so positions don't jump between renders. */
function seed(id: string) {
  let value = 0;
  for (let i = 0; i < id.length; i += 1) value = (value * 31 + id.charCodeAt(i)) % 100000;
  return value / 100000;
}

function project(origin: GeoPoint, distanceKm: number, bearing: number): GeoPoint {
  const dLat = (distanceKm / 111) * Math.cos(bearing);
  const dLng =
    (distanceKm / (111 * Math.cos((origin.lat * Math.PI) / 180) || 1)) * Math.sin(bearing);
  return { lat: origin.lat + dLat, lng: origin.lng + dLng };
}

/**
 * Anchors the responder directory around the user's live GPS fix so distances,
 * ETAs and map links move with them. Swap this for a Places API lookup once a
 * mapping provider is connected — the shape stays the same.
 */
export function locateServices(origin: GeoPoint | null): LocatedService[] {
  return nearbyServices
    .map((service) => {
      if (!origin) {
        return { ...service, coords: { lat: 0, lng: 0 } } as LocatedService;
      }
      const bearing = seed(service.id) * Math.PI * 2;
      const coords = project(origin, service.distanceKm, bearing);
      const distanceKm = Number(haversineKm(origin, coords).toFixed(1));
      return { ...service, coords, distanceKm, etaMinutes: etaMinutes(distanceKm) };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function nearestService(
  origin: GeoPoint | null,
  category: ServiceCategory,
): LocatedService | undefined {
  return locateServices(origin).find((service) => service.category === category);
}
