import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SafetyCheckin = Database["public"]["Tables"]["safety_checkins"]["Row"];
export type EmergencyNote = Database["public"]["Tables"]["emergency_notes"]["Row"];
export type BloodDonor = Database["public"]["Tables"]["blood_donors"]["Row"];
export type FavoritePlace = Database["public"]["Tables"]["favorite_places"]["Row"];
export type LocationPing = Database["public"]["Tables"]["location_pings"]["Row"];
export type ShareLinkRow = Database["public"]["Tables"]["share_links"]["Row"];

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const NOTE_CATEGORIES = [
  { value: "access", label: "Home access" },
  { value: "medical", label: "Medical instructions" },
  { value: "doctor", label: "Doctor" },
  { value: "insurance", label: "Insurance" },
  { value: "general", label: "General" },
] as const;

export const CHECKIN_PRESETS = [
  { value: "Reached home safely", minutes: 30 },
  { value: "Reached destination", minutes: 45 },
  { value: "Traveling alone", minutes: 60 },
] as const;

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

export const checkinsQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["safety-checkins", userId],
    enabled: Boolean(userId),
    refetchInterval: 20000,
    queryFn: async () =>
      unwrap(
        await supabase
          .from("safety_checkins")
          .select("*")
          .eq("user_id", userId!)
          .order("due_at", { ascending: true }),
      ) as SafetyCheckin[],
  });

export const notesQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["emergency-notes", userId],
    enabled: Boolean(userId),
    queryFn: async () =>
      unwrap(
        await supabase
          .from("emergency_notes")
          .select("*")
          .eq("user_id", userId!)
          .order("created_at", { ascending: true }),
      ) as EmergencyNote[],
  });

export const myDonorQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["blood-donor", userId],
    enabled: Boolean(userId),
    queryFn: async () =>
      unwrap(
        await supabase.from("blood_donors").select("*").eq("user_id", userId!).maybeSingle(),
      ) as BloodDonor | null,
  });

/** Public donor listing — phone numbers are never returned in bulk. */
export type DonorListing = {
  id: string;
  full_name: string;
  blood_group: string;
  city: string;
  available: boolean;
};

export const donorSearchQuery = (filters: { group: string; city: string }) =>
  queryOptions({
    queryKey: ["blood-donor-search", filters.group, filters.city],
    queryFn: async () =>
      unwrap(
        await supabase.rpc("search_blood_donors", {
          _group: filters.group,
          _city: filters.city.trim(),
        }),
      ) as DonorListing[],
  });

/** Reveals a single donor's phone on explicit user intent (audited server-side). */
export async function revealDonorPhone(donorId: string) {
  const { data, error } = await supabase.rpc("get_donor_phone", { _donor_id: donorId });
  if (error) throw new Error(error.message);
  return data as string | null;
}

export const favoritesQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["favorite-places", userId],
    enabled: Boolean(userId),
    queryFn: async () =>
      unwrap(
        await supabase
          .from("favorite_places")
          .select("*")
          .eq("user_id", userId!)
          .order("created_at", { ascending: true }),
      ) as FavoritePlace[],
  });

export const shareLinksQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["share-links", userId],
    enabled: Boolean(userId),
    queryFn: async () =>
      unwrap(
        await supabase
          .from("share_links")
          .select("*")
          .eq("user_id", userId!)
          .order("created_at", { ascending: false }),
      ) as ShareLinkRow[],
  });

export const locationPingsQuery = (emergencyId: string | undefined) =>
  queryOptions({
    queryKey: ["location-pings", emergencyId],
    enabled: Boolean(emergencyId),
    queryFn: async () =>
      unwrap(
        await supabase
          .from("location_pings")
          .select("*")
          .eq("emergency_id", emergencyId!)
          .order("created_at", { ascending: false })
          .limit(50),
      ) as LocationPing[],
  });

export async function toggleFavorite(
  userId: string,
  place: {
    place_key: string;
    name: string;
    category: string;
    address?: string | null;
    phone?: string | null;
  },
  existingId?: string,
) {
  if (existingId) {
    const { error } = await supabase.from("favorite_places").delete().eq("id", existingId);
    if (error) throw new Error(error.message);
    return false;
  }
  const { error } = await supabase.from("favorite_places").insert({
    user_id: userId,
    place_key: place.place_key,
    name: place.name,
    category: place.category,
    address: place.address ?? null,
    phone: place.phone ?? null,
  });
  if (error) throw new Error(error.message);
  return true;
}
