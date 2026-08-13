import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchNearbyServices, geocodeAddress } from "@/lib/nearby.functions";
import type { NearbyPlace, PlaceCategory } from "@/lib/nearby.server";
import { haversineKm } from "@/lib/geo";
import { hasCoords } from "@/lib/alerts";
import type { LivePosition } from "@/hooks/use-live-position";

export type NearbyResult = Record<PlaceCategory, NearbyPlace[]>;

const EMPTY: NearbyResult = {
  hospital: [],
  ambulance: [],
  police: [],
  fire: [],
  blood_bank: [],
};
/** Only re-query when the user moves more than this. */
const MOVE_THRESHOLD_KM = 0.1;

export type NearbyOrigin = { lat: number; lng: number; label?: string | null };

/**
 * Nearby emergency services anchored to the live GPS fix (or a manually entered
 * address when permission is denied). Results are cached and only refetched
 * when the anchor moves >100 m, on manual refresh, or on a new session key.
 */
export function useNearbyServices(
  position: LivePosition | null,
  options?: { sessionKey?: string | null },
) {
  const [manual, setManual] = useState<NearbyOrigin | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const anchorRef = useRef<NearbyOrigin | null>(null);

  const live: NearbyOrigin | null = position ? { lat: position.lat, lng: position.lng } : null;
  const source = manual ?? live;

  // Stable anchor: keeps the query key steady until a >100 m move.
  const anchor = useMemo(() => {
    if (!source) return null;
    const previous = anchorRef.current;
    if (previous && haversineKm(previous, source) < MOVE_THRESHOLD_KM) return previous;
    anchorRef.current = source;
    return source;
    // `source` is a fresh object every render; the coordinate fields are the real inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source?.lat, source?.lng, source?.label]);

  useEffect(() => {
    if (!manual) return;
    anchorRef.current = manual;
  }, [manual]);

  const query = useQuery({
    queryKey: [
      "nearby-services",
      anchor ? anchor.lat.toFixed(4) : null,
      anchor ? anchor.lng.toFixed(4) : null,
      options?.sessionKey ?? null,
    ],
    enabled: Boolean(anchor),
    queryFn: () => fetchNearbyServices({ data: { lat: anchor!.lat, lng: anchor!.lng } }),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
  });

  const searchAddress = useCallback(async (value: string) => {
    setManualError(null);
    setGeocoding(true);
    try {
      const hit = await geocodeAddress({ data: { query: value } });
      if (!hit) {
        setManualError("We couldn't find that place. Try a more specific address.");
        return false;
      }
      setManual({ lat: hit.lat, lng: hit.lng, label: hit.label });
      return true;
    } catch {
      setManualError("Address lookup failed. Check your connection and try again.");
      return false;
    } finally {
      setGeocoding(false);
    }
  }, []);

  const clearManual = useCallback(() => {
    setManual(null);
    setManualError(null);
  }, []);

  // Data validation: a service is only shown when it has a real name and real
  // coordinates, so Navigate/Map can never open a blank map.
  const validated = useMemo(() => {
    const raw = query.data;
    if (!raw) return EMPTY;
    const next = { ...EMPTY } as NearbyResult;
    for (const key of Object.keys(next) as PlaceCategory[]) {
      next[key] = (raw[key] ?? []).filter(
        (place) => Boolean(place?.name?.trim()) && hasCoords(place),
      );
    }
    return next;
  }, [query.data]);

  return {
    origin: anchor,
    manual,
    manualLabel: manual?.label ?? null,
    manualError,
    geocoding,
    searchAddress,
    clearManual,
    data: validated,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error as Error | null,
    refresh: () => query.refetch(),
    updatedAt: query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : null,
  };
}
