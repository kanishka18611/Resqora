/** Best-effort device telemetry used by live tracking (all optional). */
type BatteryManager = { level: number; charging: boolean };

export async function readBatteryLevel(): Promise<number | null> {
  if (typeof navigator === "undefined") return null;
  const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManager> };
  if (!nav.getBattery) return null;
  try {
    const battery = await nav.getBattery();
    return Math.round(battery.level * 100);
  } catch {
    return null;
  }
}

/** Metres/second reported by the GPS chip, when the device provides it. */
export function readSpeed(coords: GeolocationCoordinates): number | null {
  return typeof coords.speed === "number" && Number.isFinite(coords.speed) ? coords.speed : null;
}
