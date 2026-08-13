import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Emergency, EmergencyContact, Profile } from "@/lib/api";
import { coordsOf, mapsLink } from "@/lib/alerts";

export type AlertDelivery = Database["public"]["Tables"]["emergency_alert_deliveries"]["Row"];

export const deliveriesQuery = (emergencyId: string | undefined) =>
  queryOptions({
    queryKey: ["alert-deliveries", emergencyId],
    enabled: Boolean(emergencyId),
    refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_alert_deliveries")
        .select("*")
        .eq("emergency_id", emergencyId!)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return data as AlertDelivery[];
    },
  });

/** Exact alert body defined by the RESQORA emergency protocol. */
export function buildEmergencyAlert(input: {
  emergency: Emergency;
  profile: Profile | null | undefined;
  address?: string | null;
  trackingUrl?: string | null;
}) {
  const { emergency, profile, trackingUrl } = input;
  const coords = coordsOf(emergency);
  const address =
    input.address || emergency.address || profile?.home_address || "Address unavailable";
  return [
    "🚨 RESQORA Emergency Alert",
    "",
    `${profile?.full_name || "An RESQORA user"} may need immediate assistance.`,
    "",
    "Current Address:",
    address,
    "",
    "Live Location:",
    trackingUrl || (coords ? mapsLink(coords) : "Awaiting GPS fix"),
    "",
    "Time:",
    new Date(emergency.started_at).toLocaleString(),
    "",
    "Emergency ID:",
    emergency.id.slice(0, 8).toUpperCase(),
    "",
    "Status:",
    "Emergency Active",
  ].join("\n");
}

export function buildResolvedAlert(input: {
  emergency: Emergency;
  profile: Profile | null | undefined;
}) {
  const { emergency, profile } = input;
  return [
    "✅ RESQORA Emergency Resolved",
    "",
    `${profile?.full_name || "An RESQORA user"} has confirmed they are safe.`,
    "",
    "Emergency ID:",
    emergency.id.slice(0, 8).toUpperCase(),
    "",
    "Resolved at:",
    new Date().toLocaleString(),
    "",
    "Live location sharing has been stopped.",
  ].join("\n");
}

/** Creates one pending delivery row per trusted contact. */
export async function seedDeliveries(input: {
  userId: string;
  emergencyId: string;
  contacts: EmergencyContact[];
  kind?: "alert" | "resolved";
}) {
  if (input.contacts.length === 0) return [];
  const rows = input.contacts.map((contact) => ({
    user_id: input.userId,
    emergency_id: input.emergencyId,
    contact_id: contact.id,
    contact_name: contact.name,
    contact_phone: contact.phone,
    channel: "sms",
    status: "pending",
    kind: input.kind ?? "alert",
  }));
  const { data, error } = await supabase
    .from("emergency_alert_deliveries")
    .insert(rows)
    .select("*");
  if (error) throw new Error(error.message);
  return data as AlertDelivery[];
}

export async function markDelivery(
  id: string,
  status: "delivered" | "failed" | "pending",
  options: { channel?: string; error?: string | null } = {},
) {
  const { error } = await supabase
    .from("emergency_alert_deliveries")
    .update({
      status,
      channel: options.channel,
      error: options.error ?? null,
      sent_at: status === "delivered" ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Attempts automatic delivery through the connected SMS provider and records the
 * outcome per contact. Returns false when no provider is connected so the UI can
 * offer WhatsApp / SMS / email hand-off instead.
 */
export async function dispatchDeliveries(input: { deliveries: AlertDelivery[]; message: string }) {
  const targets = input.deliveries.filter((d) => d.status !== "delivered" && d.contact_phone);
  if (targets.length === 0) return true;
  const { sendEmergencyAlerts } = await import("@/lib/alerts.functions");
  const response = await sendEmergencyAlerts({
    data: {
      message: input.message,
      recipients: targets.map((d) => ({
        id: d.id,
        name: d.contact_name,
        phone: d.contact_phone!,
      })),
    },
  });
  if (!response.configured) return false;
  await Promise.all(
    response.results.map((result) =>
      markDelivery(result.id, result.status, { channel: "sms", error: result.error ?? null }),
    ),
  );
  return true;
}
