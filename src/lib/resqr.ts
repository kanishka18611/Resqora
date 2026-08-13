import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { randomToken, origin } from "@/lib/share";

export type ResqrId = Database["public"]["Tables"]["resqr_ids"]["Row"];

/** Live SOS state exposed on a scanned RESQR ID while an emergency is running. */
export type ResqrActiveEmergency = {
  reference: string;
  type: string;
  severity: string;
  status: string;
  live_status: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  started_at: string;
  location_updated_at: string | null;
};

/** Emergency-only projection returned by the secure lookup. Never contains PII beyond care needs. */
export type ResqrSummary = {
  code: string;
  full_name: string | null;
  blood_group: string | null;
  age: number | null;
  allergies: string | null;
  medications: string | null;
  medical_conditions: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  preferred_hospital: string | null;
  preferred_language: string | null;
  active_emergency: ResqrActiveEmergency | null;
};

export const NOT_PROVIDED = "Not Provided.";

export function resqrUrl(code: string) {
  return `${origin()}/r/${code}`;
}

/** Opaque 40-character code — the QR carries only this, never medical data. */
function newCode() {
  return `RQ${randomToken(19)}`.slice(0, 40);
}

export const myResqrIdQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["resqr-id", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const existing = await supabase
        .from("resqr_ids")
        .select("*")
        .eq("user_id", userId!)
        .eq("active", true)
        .maybeSingle();
      if (existing.error) throw new Error(existing.error.message);
      if (existing.data) return existing.data as ResqrId;

      const created = await supabase
        .from("resqr_ids")
        .insert({ user_id: userId!, code: newCode() })
        .select("*")
        .single();
      if (created.error) throw new Error(created.error.message);
      return created.data as ResqrId;
    },
  });

/** Invalidates the previous code and issues a fresh one. */
export async function regenerateResqrId(userId: string, currentId?: string) {
  if (currentId) {
    const { error } = await supabase
      .from("resqr_ids")
      .update({ active: false })
      .eq("id", currentId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
  }
  const previous = currentId ? 1 : 0;
  const { data, error } = await supabase
    .from("resqr_ids")
    .insert({ user_id: userId, code: newCode(), regenerated_count: previous })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as ResqrId;
}

export const resqrSummaryQuery = (code: string | undefined) =>
  queryOptions({
    queryKey: ["resqr-summary", code],
    enabled: Boolean(code),
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_resqr_summary", { _code: code! });
      if (error) throw new Error(error.message);
      return (data as ResqrSummary | null) ?? null;
    },
  });

/** Extracts a RESQR code from a raw scan result (URL or bare code). */
export function parseResqrCode(raw: string): string | null {
  const value = raw.trim();
  const fromUrl = value.match(/\/r\/([A-Za-z0-9]{16,64})/);
  if (fromUrl?.[1]) return fromUrl[1];
  if (/^RQ[a-f0-9]{16,62}$/i.test(value)) return value;
  return null;
}
