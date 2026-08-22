/** Real-world emergency service lookup (no placeholder data). */
export type PlaceCategory = "hospital" | "ambulance" | "police" | "fire" | "blood_bank";

export type NearbyPlace = {
  id: string;
  name: string;
  category: PlaceCategory;
  lat: number;
  lng: number;
  address: string;
  phone: string | null;
  openNow: boolean | null;
  distanceKm: number;
  etaMinutes: number;
};

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat));
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function etaMinutes(distanceKm: number) {
  return Math.max(2, Math.round((distanceKm / 26) * 60) + 2);
}

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const GOOGLE_PLACES_API_URL = "https://places.googleapis.com/v1";

const GOOGLE_TYPES: Record<PlaceCategory, string[]> = {
  hospital: ["hospital"],
  ambulance: [],
  police: ["police"],
  fire: ["fire_station"],
  blood_bank: ["blood_donation_facility"],
};

/**
 * Emergency-capable hospital filtering. Clinics, day-care and cosmetic
 * providers cannot receive emergencies, so they are dropped outright, and
 * trauma / general / multi-specialty hospitals are ranked first.
 */
const HOSPITAL_EXCLUDE =
  /(clinic|polyclinic|physio|physiotherap|chiroprac|dental|dentist|orthodont|cosmetic|aesthet|derma|skin|hair|slim|weight|wellness|spa|ayurved|homoeopath|homeopath|unani|siddha|acupunc|veterinar|animal|pet|optic|optical|eye care|eyecare|spectacle|lab(oratory)?\b|diagnostic|scan cent|imaging cent|pharmac|medical (store|shop)|fertility|ivf|dialysis cent|counsel|rehab|nursing college|medical college hostel|dispensar)/i;

const HOSPITAL_PRIORITY =
  /(government|govt|general hospital|district hospital|civil hospital|medical college|institute of medical|trauma|emergency|multi[- ]?spec|multispec|super[- ]?spec|superspec|apollo|aiims|city hospital|memorial hospital)/i;

function isEmergencyHospital(name: string) {
  if (HOSPITAL_EXCLUDE.test(name)) return false;
  return /hospital|medical cent|medical college|trauma|infirmary|emergency/i.test(name)
    ? true
    : // Unnamed-type facilities coming from an explicit hospital tag stay in.
      true;
}

function rankHospitals(places: NearbyPlace[]) {
  return places
    .filter((place) => isEmergencyHospital(place.name))
    .sort((a, b) => {
      const pa = HOSPITAL_PRIORITY.test(a.name) ? 0 : 1;
      const pb = HOSPITAL_PRIORITY.test(b.name) ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return a.distanceKm - b.distanceKm;
    });
}

type GooglePlace = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  currentOpeningHours?: { openNow?: boolean };
  location?: { latitude: number; longitude: number };
};

/** Google Places (New) nearby search directly via Google API. */
async function googleNearby(
  origin: { lat: number; lng: number },
  category: PlaceCategory,
  perCategory: number,
): Promise<NearbyPlace[]> {
  const connectorKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!connectorKey) throw new Error("Google Maps API not configured");

  // Blood banks and ambulance services have no reliable nearby-search type,
  // so they use a distance-ranked text search instead.
  const isText = category === "blood_bank" || category === "ambulance";
  const textQuery = category === "blood_bank" ? "blood bank" : "ambulance service";
  const endpoint = isText
    ? `${GOOGLE_PLACES_API_URL}/places:searchText`
    : `${GOOGLE_PLACES_API_URL}/places:searchNearby`;
  const body = isText
    ? {
        textQuery,
        maxResultCount: Math.max(perCategory, 5),
        rankPreference: "DISTANCE",
        locationBias: {
          circle: { center: { latitude: origin.lat, longitude: origin.lng }, radius: 30000 },
        },
      }
    : {
        includedTypes: GOOGLE_TYPES[category],
        maxResultCount: Math.max(perCategory, 5),
        rankPreference: "DISTANCE",
        locationRestriction: {
          circle: { center: { latitude: origin.lat, longitude: origin.lng }, radius: 30000 },
        },
      };

  const res = await fetch(endpoint + `?key=${connectorKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.internationalPhoneNumber,places.currentOpeningHours.openNow",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Google Places request failed [${res.status}]: ${body}`);
    throw new Error(`Google Places request failed [${res.status}]`);
  }
  const data = (await res.json()) as { places?: GooglePlace[] };
  const mapped = (data.places ?? [])
    .filter((place) => place.location && place.displayName?.text)
    .map((place) => {
      const lat = place.location!.latitude;
      const lng = place.location!.longitude;
      const distanceKm = Number(haversineKm(origin, { lat, lng }).toFixed(2));
      return {
        id: place.id,
        name: place.displayName!.text!,
        category,
        lat,
        lng,
        address: place.formattedAddress ?? "",
        phone: place.nationalPhoneNumber ?? place.internationalPhoneNumber ?? null,
        openNow: place.currentOpeningHours?.openNow ?? null,
        distanceKm,
        etaMinutes: etaMinutes(distanceKm),
      } satisfies NearbyPlace;
    });
  const ordered =
    category === "hospital"
      ? rankHospitals(mapped)
      : mapped.sort((a, b) => a.distanceKm - b.distanceKm);
  return ordered.slice(0, perCategory);
}

const FILTERS: Record<PlaceCategory, string[]> = {
  hospital: ['["amenity"="hospital"]', '["healthcare"="hospital"]'],
  ambulance: ['["emergency"="ambulance_station"]'],
  police: ['["amenity"="police"]'],
  fire: ['["amenity"="fire_station"]'],
  blood_bank: ['["healthcare"="blood_donation"]', '["amenity"="blood_bank"]'],
};

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function buildQuery(lat: number, lng: number, radius: number) {
  const union = Object.values(FILTERS)
    .flat()
    .flatMap((filter) =>
      ["node", "way", "relation"].map(
        (kind) => `${kind}${filter}(around:${radius},${lat},${lng});`,
      ),
    )
    .join("\n");
  return `[out:json][timeout:20];(\n${union}\n);out center tags 120;`;
}

function categorise(tags: Record<string, string>): PlaceCategory | null {
  if (tags.healthcare === "blood_donation" || tags.amenity === "blood_bank") return "blood_bank";
  if (tags.emergency === "ambulance_station") return "ambulance";
  if (tags.amenity === "hospital" || tags.healthcare === "hospital") return "hospital";
  if (tags.amenity === "police") return "police";
  if (tags.amenity === "fire_station") return "fire";
  return null;
}

function formatAddress(tags: Record<string, string>) {
  const line = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
  return (
    [
      line,
      tags["addr:suburb"],
      tags["addr:city"] || tags["addr:town"] || tags["addr:village"],
      tags["addr:postcode"],
      tags["addr:state"],
    ]
      .filter(Boolean)
      .join(", ") ||
    tags["addr:full"] ||
    ""
  );
}

function parseOpenNow(tags: Record<string, string>): boolean | null {
  const hours = tags.opening_hours;
  if (!hours) return null;
  if (/24\/7/.test(hours)) return true;
  return null;
}

async function overpass(query: string) {
  let lastError: unknown = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ data: query }).toString(),
      });
      if (!res.ok) {
        lastError = new Error(`Overpass ${res.status}`);
        continue;
      }
      return (await res.json()) as { elements: OverpassElement[] };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Overpass unavailable");
}

/** Top N real services per category, sorted by straight-line distance. */
export async function findNearbyServices(
  origin: { lat: number; lng: number },
  perCategory = 3,
): Promise<Record<PlaceCategory, NearbyPlace[]>> {
  const result: Record<PlaceCategory, NearbyPlace[]> = {
    hospital: [],
    ambulance: [],
    police: [],
    fire: [],
    blood_bank: [],
  };

  if (process.env.GOOGLE_MAPS_API_KEY) {
    try {
      const categories = Object.keys(result) as PlaceCategory[];
      const lists = await Promise.all(
        categories.map((category) =>
          googleNearby(origin, category, perCategory).catch(() => [] as NearbyPlace[]),
        ),
      );
      categories.forEach((category, index) => {
        result[category] = lists[index];
      });
      if (categories.some((category) => result[category].length > 0)) return result;
    } catch (error) {
      console.error("Google Places lookup failed, falling back to OpenStreetMap", error);
    }
  }

  let elements: OverpassElement[] = [];
  for (const radius of [8000, 25000, 60000]) {
    const data = await overpass(buildQuery(origin.lat, origin.lng, radius));
    elements = data.elements ?? [];
    const named = elements.filter((el) => el.tags?.name);
    if (named.length >= 4) break;
  }

  const seen = new Set<string>();
  const places: NearbyPlace[] = [];
  for (const el of elements) {
    const tags = el.tags ?? {};
    const name = tags.name;
    if (!name) continue;
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat == null || lng == null) continue;
    const category = categorise(tags);
    if (!category) continue;
    // Never surface clinics or cosmetic providers as emergency hospitals.
    if (category === "hospital" && !isEmergencyHospital(name)) continue;
    const key = `${category}:${name.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const distanceKm = Number(haversineKm(origin, { lat, lng }).toFixed(2));
    places.push({
      id: `${el.type}-${el.id}`,
      name,
      category,
      lat,
      lng,
      address: formatAddress(tags),
      phone: tags.phone || tags["contact:phone"] || tags["emergency:phone"] || null,
      openNow: parseOpenNow(tags),
      distanceKm,
      etaMinutes: etaMinutes(distanceKm),
    });
  }

  const sorted = [
    ...rankHospitals(places.filter((place) => place.category === "hospital")),
    ...places
      .filter((place) => place.category !== "hospital")
      .sort((a, b) => a.distanceKm - b.distanceKm),
  ];
  for (const place of sorted) {
    if (result[place.category].length < perCategory) result[place.category].push(place);
  }
  return result;
}

/** Forward geocode a typed address / city into coordinates. */
export async function geocodePlace(query: string) {
  const connectorKey = process.env.GOOGLE_MAPS_API_KEY;
  if (connectorKey) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${connectorKey}`,
      );
      if (res.ok) {
        const data = (await res.json()) as {
          results?: Array<{
            formatted_address: string;
            geometry: { location: { lat: number; lng: number } };
          }>;
        };
        const hit = data.results?.[0];
        if (hit) {
          return {
            lat: hit.geometry.location.lat,
            lng: hit.geometry.location.lng,
            label: hit.formatted_address,
          };
        }
        return null;
      }
      console.error(`Geocoding failed [${res.status}]: ${await res.text()}`);
    } catch (error) {
      console.error("Google geocoding failed, falling back", error);
    }
  }
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "User-Agent": "RESQORA-emergency-app" } });
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  const hit = data[0];
  if (!hit) return null;
  return { lat: Number(hit.lat), lng: Number(hit.lon), label: hit.display_name };
}
