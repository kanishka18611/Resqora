import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { coordsOf, mapsLink } from "@/lib/alerts";
import type { Emergency, Profile } from "@/lib/api";

export type ShareLink = Database["public"]["Tables"]["share_links"]["Row"];

/**
 * Cryptographically secure share token. 24 bytes = 48 hex characters, and the
 * database rejects anything shorter than 32 characters.
 */
export function randomToken(bytes = 24) {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function origin() {
  return typeof window === "undefined" ? "" : window.location.origin;
}

export function shareUrl(link: Pick<ShareLink, "kind" | "token">) {
  return `${origin()}/${link.kind === "medical" ? "m" : "s"}/${link.token}`;
}

/** Returns the active live-tracking link for an emergency, creating one on demand. */
export async function ensureLiveShareLink(userId: string, emergencyId: string) {
  const existing = await supabase
    .from("share_links")
    .select("*")
    .eq("user_id", userId)
    .eq("emergency_id", emergencyId)
    .eq("kind", "live")
    .eq("active", true)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data as ShareLink;

  const { data, error } = await supabase
    .from("share_links")
    .insert({
      user_id: userId,
      emergency_id: emergencyId,
      kind: "live",
      token: randomToken(),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as ShareLink;
}

/** Returns the user's permanent medical-profile link, creating one on demand. */
export async function ensureMedicalShareLink(userId: string) {
  const existing = await supabase
    .from("share_links")
    .select("*")
    .eq("user_id", userId)
    .eq("kind", "medical")
    .eq("active", true)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data as ShareLink;

  const { data, error } = await supabase
    .from("share_links")
    .insert({ user_id: userId, kind: "medical", token: randomToken() })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as ShareLink;
}

export async function revokeShareLink(id: string) {
  const { error } = await supabase.from("share_links").update({ active: false }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function rotateShareLink(link: ShareLink) {
  const { data, error } = await supabase
    .from("share_links")
    .update({ token: randomToken() })
    .eq("id", link.id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as ShareLink;
}

export function buildSosMessage(input: {
  emergency: Emergency;
  profile: Profile | null | undefined;
  link?: string | null;
}) {
  const { emergency, profile, link } = input;
  const coords = coordsOf(emergency);
  const lines = [
    `🚨 EMERGENCY — ${profile?.full_name || "An RESQORA user"} needs help.`,
    `Type: ${emergency.type}`,
    `Time: ${new Date(emergency.started_at).toLocaleString()}`,
  ];
  if (emergency.address || profile?.home_address) {
    lines.push(`Address: ${emergency.address || profile?.home_address}`);
  }
  if (coords) {
    lines.push(`Coordinates: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
    lines.push(`Map: ${mapsLink(coords)}`);
  }
  if (link) lines.push(`Live tracking: ${link}`);
  lines.push(`Reference: ${emergency.id.slice(0, 8).toUpperCase()}`);
  lines.push(`Please call them now or contact local emergency services.`);
  return lines.join("\n");
}

export function whatsappHref(message: string, phone?: string | null) {
  const digits = (phone ?? "").replace(/[^\d]/g, "");
  const base = digits ? `https://wa.me/${digits}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function smsHref(message: string, phone?: string | null) {
  const digits = (phone ?? "").replace(/[^\d+]/g, "");
  return `sms:${digits}?&body=${encodeURIComponent(message)}`;
}

export function emailHref(message: string, subject = "RESQORA emergency alert") {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}
