import type { PlaceCategory } from "@/lib/nearby.server";

const PLAN: Record<string, PlaceCategory[]> = {
  accident: ["hospital", "ambulance", "police", "fire"],
  fire: ["fire", "hospital", "ambulance", "police"],
  medical: ["hospital", "ambulance"],
  crime: ["police", "hospital"],
  natural: ["fire", "hospital", "police"],
  flood: ["fire", "hospital", "police"],
  sos: ["hospital", "ambulance", "police"],
};

export const ROLE_LABEL: Record<PlaceCategory, string> = {
  hospital: "Hospital",
  ambulance: "Ambulance service",
  police: "Police response",
  fire: "Fire & rescue",
  blood_bank: "Blood supply",
};

/**
 * Universal emergency line — a real public number, used only as the fallback
 * when no official service phone number is published nearby.
 */
export const EMERGENCY_LINE = {
  name: "Public emergency line",
  phone: "112",
};

/** Service categories that matter for an emergency type, most relevant first. */
export function coordinationCategories(type: string, severity?: string | null): PlaceCategory[] {
  const categories = [...(PLAN[type] ?? PLAN.sos)];
  if ((severity === "critical" || severity === "high") && !categories.includes("blood_bank")) {
    categories.push("blood_bank");
  }
  return categories;
}

export const PANEL_CATEGORIES: PlaceCategory[] = [
  "hospital",
  "ambulance",
  "police",
  "fire",
  "blood_bank",
];
