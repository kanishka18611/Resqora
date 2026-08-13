import { supabase } from "@/integrations/supabase/client";
import { coordsOf, mapsLink } from "@/lib/alerts";
import type { AlertDelivery } from "@/lib/alert-delivery";
import type { Emergency, EmergencyContact, Profile } from "@/lib/api";
import { whatsappHref } from "@/lib/share";

/**
 * Exact WhatsApp body defined by the RESQORA emergency sharing protocol.
 * Every value is real: live GPS coordinates, resolved address, the secure
 * tracking URL and the emergency session id.
 */
export function buildWhatsappAlert(input: {
  emergency: Emergency;
  profile: Profile | null | undefined;
  address?: string | null;
  trackingUrl?: string | null;
}) {
  const { emergency, profile, trackingUrl } = input;
  const coords = coordsOf(emergency);
  const name = profile?.full_name || "An RESQORA user";
  const address =
    input.address || emergency.address || profile?.home_address || "Address unavailable";
  const statusLine =
    emergency.live_status === "safe"
      ? "🟢 Marked safe"
      : emergency.live_status === "help_arrived"
        ? "🟠 Help has arrived"
        : "🔴 Emergency Active";
  return [
    "🚨 RESQORA Emergency Alert",
    "",
    `${name} has activated the RESQORA Emergency SOS.`,
    "",
    "🕒 Time:",
    new Date(emergency.started_at).toLocaleString(),
    "",
    "📍 Current Address:",
    address,
    "",
    "🗺 Google Maps:",
    coords ? mapsLink(coords) : "Awaiting GPS fix",
    "",
    "📡 Live Tracking:",
    trackingUrl || "Tracking link unavailable",
    "",
    "🆔 Emergency ID:",
    emergency.id.slice(0, 8).toUpperCase(),
    "",
    "Status:",
    statusLine,
    "",
    "Please contact the user immediately or proceed to their location if appropriate.",
  ].join("\n");
}

/**
 * Normalises a saved contact number into the international (E.164 digits only)
 * form WhatsApp requires. `fallbackDialCode` comes from the user's own phone
 * number so local contacts can still be reached.
 */
export function normalizeWhatsappPhone(
  phone: string | null | undefined,
  ownerPhone?: string | null,
): { number: string | null; problem?: string } {
  const raw = (phone ?? "").trim();
  if (!raw) return { number: null, problem: "No phone number saved for this contact." };
  let digits = raw.replace(/[^\d]/g, "");
  const international = raw.startsWith("+") || digits.startsWith("00");
  if (digits.startsWith("00")) digits = digits.slice(2);

  if (!international) {
    const local = digits.replace(/^0+/, "");
    const code = ownerDialCode(ownerPhone);
    if (local.length > 11) {
      digits = local;
    } else if (code) {
      digits = `${code}${local}`;
    } else {
      return {
        number: null,
        problem: "Add the country code (e.g. +91) to this contact's phone number.",
      };
    }
  }
  if (digits.length < 8 || digits.length > 15) {
    return { number: null, problem: `“${raw}” is not a valid international number.` };
  }
  return { number: digits };
}

/**
 * Derives the account owner's country dial code from their own saved number so
 * local contact numbers can be upgraded to international format.
 */
export function ownerDialCode(ownerPhone: string | null | undefined) {
  const raw = (ownerPhone ?? "").trim();
  if (!raw.startsWith("+") && !raw.startsWith("00")) return null;
  const digits = raw.replace(/[^\d]/g, "").replace(/^00/, "");
  // National numbers are ~10 digits, so anything before that is the dial code.
  return digits.length > 10 ? digits.slice(0, digits.length - 10) : null;
}

export function contactsWithPhone(contacts: EmergencyContact[]) {
  return contacts.filter((contact) => Boolean(contact.phone?.replace(/[^\d]/g, "")));
}

/**
 * WhatsApp cannot be delivered by a server without a paid Business API, so RESQORA
 * prepares one ready-to-send message per contact and records the share state.
 */
export async function prepareWhatsappShares(input: {
  userId: string;
  emergencyId: string;
  contacts: EmergencyContact[];
}) {
  const targets = contactsWithPhone(input.contacts);
  if (targets.length === 0) return [];

  const existing = await supabase
    .from("emergency_alert_deliveries")
    .select("*")
    .eq("emergency_id", input.emergencyId)
    .eq("channel", "whatsapp");
  if (existing.error) throw new Error(existing.error.message);
  const already = new Set((existing.data ?? []).map((row) => row.contact_id));
  const missing = targets.filter((contact) => !already.has(contact.id));
  if (missing.length === 0) return existing.data as AlertDelivery[];

  const { data, error } = await supabase
    .from("emergency_alert_deliveries")
    .insert(
      missing.map((contact) => ({
        user_id: input.userId,
        emergency_id: input.emergencyId,
        contact_id: contact.id,
        contact_name: contact.name,
        contact_phone: contact.phone,
        contact_email: contact.email,
        channel: "whatsapp",
        status: "pending",
        kind: "alert",
      })),
    )
    .select("*");
  if (error) throw new Error(error.message);
  return [...((existing.data ?? []) as AlertDelivery[]), ...(data as AlertDelivery[])];
}

export async function markWhatsappShared(id: string) {
  const { error } = await supabase
    .from("emergency_alert_deliveries")
    .update({ status: "delivered", error: null, sent_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Direct wa.me link for one contact, or null when the number is unusable. */
export function whatsappShareLink(
  message: string,
  phone?: string | null,
  fallbackDialCode?: string | null,
) {
  const { number, problem } = normalizeWhatsappPhone(phone, fallbackDialCode);
  if (!number) return { href: null, problem };
  return { href: whatsappHref(message, number), problem: undefined };
}

/** Records the outcome of every WhatsApp share attempt against the delivery row. */
export async function logWhatsappAttempt(input: {
  deliveryId: string;
  ok: boolean;
  error?: string;
}) {
  const { error } = await supabase
    .from("emergency_alert_deliveries")
    .update({
      status: input.ok ? "delivered" : "failed",
      error: input.ok ? null : (input.error ?? "WhatsApp could not be opened"),
      sent_at: input.ok ? new Date().toISOString() : null,
    })
    .eq("id", input.deliveryId);
  if (error) throw new Error(error.message);
}
