import { useEffect, useState } from "react";

export type LivePosition = {
  lat: number;
  lng: number;
  accuracy: number;
  updatedAt: Date;
  source: "gps" | "manual";
};

export type LocationStatus = "idle" | "locating" | "granted" | "manual" | "denied" | "unavailable";

export type ManualLocation = { lat: number; lng: number; label: string };

const MANUAL_KEY = "aegis.manual-location";

type State = {
  status: LocationStatus;
  position: LivePosition | null;
  address: string | null;
  manual: ManualLocation | null;
  resolving: boolean;
};

let state: State = {
  status: "idle",
  position: null,
  address: null,
  manual: null,
  resolving: false,
};

const listeners = new Set<() => void>();
let started = false;
let watchId: number | null = null;
let intervalId: number | null = null;
/** High-accuracy continuous tracking is reserved for an active emergency. */
let highAccuracy = false;

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

async function reverseGeocode(lat: number, lng: number) {
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

let lastResolvedKey: string | null = null;

function resolveAddress(lat: number, lng: number) {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  if (key === lastResolvedKey) return;
  lastResolvedKey = key;
  set({ resolving: true });
  void reverseGeocode(lat, lng).then((value) => {
    set({ resolving: false, ...(value ? { address: value } : {}) });
  });
}

function acceptFix(pos: GeolocationPosition) {
  set({
    status: "granted",
    position: {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      updatedAt: new Date(),
      source: "gps",
    },
  });
  resolveAddress(pos.coords.latitude, pos.coords.longitude);
}

function applyManual(manual: ManualLocation) {
  set({
    manual,
    status: state.status === "granted" ? state.status : "manual",
    address: manual.label,
    position:
      state.position && state.position.source === "gps"
        ? state.position
        : {
            lat: manual.lat,
            lng: manual.lng,
            accuracy: 0,
            updatedAt: new Date(),
            source: "manual",
          },
  });
}

function handleError(error: GeolocationPositionError) {
  // Only fall back to the "denied" flow when there is nothing usable yet.
  if (state.position) return;
  if (state.manual) {
    set({ status: "manual" });
    return;
  }
  set({ status: error.code === error.PERMISSION_DENIED ? "denied" : "unavailable" });
}

function startWatch() {
  if (watchId !== null) return;
  set({ status: state.position ? state.status : "locating" });
  watchId = navigator.geolocation.watchPosition(acceptFix, handleError, {
    enableHighAccuracy: highAccuracy,
    maximumAge: 10_000,
    timeout: 15_000,
  });
  // Only while an SOS is active: force a fresh fix every 10s even when the
  // device reports no movement. Normal browsing just follows the watcher.
  if (highAccuracy) {
    intervalId = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition(acceptFix, () => undefined, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 9000,
      });
    }, 10_000);
  }
}

function stopWatch() {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  if (intervalId !== null) window.clearInterval(intervalId);
  watchId = null;
  intervalId = null;
}

/**
 * Turns high-accuracy continuous tracking on while an emergency is active and
 * back off (releasing the GPS radio) once it ends.
 */
export function setHighAccuracyTracking(enabled: boolean) {
  if (typeof window === "undefined" || highAccuracy === enabled) return;
  highAccuracy = enabled;
  if (!started || !navigator.geolocation) return;
  stopWatch();
  startWatch();
}

/** Starts the shared geolocation watcher exactly once per page session. */
function start() {
  if (started || typeof window === "undefined") return;
  started = true;

  try {
    const stored = window.localStorage.getItem(MANUAL_KEY);
    if (stored) applyManual(JSON.parse(stored) as ManualLocation);
  } catch {
    /* ignore malformed cache */
  }

  if (!navigator.geolocation) {
    if (!state.manual) set({ status: "unavailable" });
    return;
  }
  startWatch();
}

/** Re-prompt (or re-check) browser permission after the user taps Enable location. */
export async function requestLocationPermission(): Promise<LocationStatus> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    set({ status: "unavailable" });
    return "unavailable";
  }
  set({ status: state.position?.source === "gps" ? "granted" : "locating" });
  return new Promise<LocationStatus>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        acceptFix(pos);
        startWatch();
        resolve("granted");
      },
      (error) => {
        handleError(error);
        resolve(state.status);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 },
    );
  });
}

/** Anchor the app to a manually entered address when GPS is unavailable. */
export function setManualLocation(manual: ManualLocation) {
  applyManual(manual);
  try {
    window.localStorage.setItem(MANUAL_KEY, JSON.stringify(manual));
  } catch {
    /* storage disabled */
  }
}

export function clearManualLocation() {
  set({ manual: null });
  try {
    window.localStorage.removeItem(MANUAL_KEY);
  } catch {
    /* storage disabled */
  }
}

/**
 * Shared live location. The browser is prompted only once per session; every
 * consumer subscribes to the same fix, address and permission state.
 */
export function useLivePosition() {
  const [snapshot, setSnapshot] = useState(state);

  useEffect(() => {
    const listener = () => setSnapshot(state);
    listeners.add(listener);
    start();
    listener();
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        stopWatch();
        started = false;
      }
    };
  }, []);

  return {
    position: snapshot.position,
    address: snapshot.address,
    manual: snapshot.manual,
    status: snapshot.status,
    resolvingAddress: snapshot.resolving,
    /** True only when there is no usable location at all. */
    denied: snapshot.status === "denied" || snapshot.status === "unavailable",
    permissionBlocked: snapshot.status === "denied",
    unavailable: snapshot.status === "unavailable",
    requestPermission: requestLocationPermission,
    setManualLocation,
    clearManualLocation,
  };
}
