/** Shared reverse-geocoding helper (BigDataCloud — no API key required). */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      locality?: string;
      city?: string;
      principalSubdivision?: string;
      countryName?: string;
    };
    return (
      [data.locality || data.city, data.principalSubdivision, data.countryName]
        .filter(Boolean)
        .join(", ") || null
    );
  } catch {
    return null;
  }
}
