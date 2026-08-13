import { supabase } from "@/integrations/supabase/client";
import { coordsOf, mapsLink } from "@/lib/alerts";
/** Escapes user-supplied values before embedding them in the HTML email. */
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
import type { AlertDelivery } from "@/lib/alert-delivery";
import type { Emergency, EmergencyContact, Profile } from "@/lib/api";
import {
  EMAIL_NOT_CONFIGURED,
  isEmailConfigured,
  isValidEmail,
  sendAndRecord,
  type EmergencyTemplateParams,
} from "@/lib/email-service";

/** Full emergency email body defined by the RESQORA communication protocol. */
export function buildEmergencyEmail(input: {
  emergency: Emergency;
  profile: Profile | null | undefined;
  address?: string | null;
  trackingUrl?: string | null;
  status?: string;
}) {
  const { emergency, profile, trackingUrl } = input;
  const coords = coordsOf(emergency);
  const name = profile?.full_name || "An RESQORA user";
  const address =
    input.address || emergency.address || profile?.home_address || "Address unavailable";
  const subject = `🚨 RESQORA Emergency Alert — ${name}`;
  const shareMedical = profile?.share_medical_in_alerts !== false;
  const medical = shareMedical
    ? [
        profile?.blood_group ? `Blood group: ${profile.blood_group}` : null,
        profile?.allergies ? `Allergies: ${profile.allergies}` : null,
        profile?.medical_conditions ? `Conditions: ${profile.medical_conditions}` : null,
        profile?.medications ? `Medications: ${profile.medications}` : null,
      ].filter(Boolean)
    : [];
  const message = [
    "🚨 RESQORA Emergency Alert",
    "",
    `${name} has triggered an Emergency SOS and may need immediate assistance.`,
    "",
    `User Name: ${name}`,
    `Emergency Type: ${emergency.type.replace(/_/g, " ")}`,
    `Current Status: ${(input.status ?? emergency.status).replace(/_/g, " ")}`,
    `Their Phone Number: ${profile?.phone || "Not provided"}`,
    `Emergency Started: ${new Date(emergency.started_at).toLocaleString()}`,
    `Current Address: ${address}`,
    `Latitude: ${coords ? coords.lat.toFixed(6) : "Awaiting GPS"}`,
    `Longitude: ${coords ? coords.lng.toFixed(6) : "Awaiting GPS"}`,
    `Google Maps: ${coords ? mapsLink(coords) : "Pending location capture"}`,
    `Live Tracking Link: ${trackingUrl || "Not available"}`,
    `Emergency Time: ${new Date().toLocaleString()}`,
    `Emergency ID: ${emergency.id.slice(0, 8).toUpperCase()}`,
    ...(medical.length > 0 ? ["", "Medical information:", ...medical] : []),
    "",
    trackingUrl ? `▶ OPEN LIVE TRACKING: ${trackingUrl}` : "",
    "",
    "Please call them now or contact local emergency services.",
  ].join("\n");
  return { subject, message };
}

export function buildResolvedEmail(input: {
  emergency: Emergency;
  profile: Profile | null | undefined;
}) {
  const name = input.profile?.full_name || "An RESQORA user";
  return {
    subject: `✅ RESQORA Emergency Resolved — ${name}`,
    message: [
      "✅ RESQORA Emergency Resolved",
      "",
      `${name} has confirmed they are safe.`,
      "",
      `Emergency ID: ${input.emergency.id.slice(0, 8).toUpperCase()}`,
      `Resolved at: ${new Date().toLocaleString()}`,
      "",
      "Live location sharing has been stopped.",
    ].join("\n"),
  };
}

/**
 * Contacts that can actually receive an email: a valid address, and one row per
 * address so the same person never receives the same alert twice.
 */
export function contactsWithEmail(contacts: EmergencyContact[]) {
  const seen = new Set<string>();
  return contacts.filter((contact) => {
    if (!isValidEmail(contact.email)) return false;
    const key = contact.email!.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Creates one pending email delivery row per contact that has an address. */
export async function seedEmailDeliveries(input: {
  userId: string;
  emergencyId: string;
  contacts: EmergencyContact[];
  kind?: "alert" | "resolved";
}) {
  const targets = contactsWithEmail(input.contacts);
  if (targets.length === 0) return [];
  const { data, error } = await supabase
    .from("emergency_alert_deliveries")
    .insert(
      targets.map((contact) => ({
        user_id: input.userId,
        emergency_id: input.emergencyId,
        contact_id: contact.id,
        contact_name: contact.name,
        contact_phone: contact.phone,
        contact_email: contact.email,
        channel: "email",
        status: "pending",
        kind: input.kind ?? "alert",
      })),
    )
    .select("*");
  if (error) throw new Error(error.message);
  return data as AlertDelivery[];
}

function statusLine(emergency: Emergency) {
  if (emergency.status === "resolved" || emergency.live_status === "safe") {
    return "✅ Emergency resolved";
  }
  if (emergency.status === "cancelled") return "✅ Emergency cancelled";
  if (emergency.live_status === "help_arrived") return "🟠 Help has arrived";
  return "🔴 Emergency active";
}

/**
 * Professional HTML email body with a large primary “🔴 View Live Location”
 * button that opens the secure Guardian dashboard. Passed to EmailJS as
 * `message_html` so the template can render it with {{{message_html}}}.
 */
export function buildEmergencyEmailHtml(input: {
  name: string;
  time: string;
  address: string;
  mapLink: string;
  trackingUrl: string | null;
  reference: string;
  status: string;
  supportContact: string;
}) {
  const e = escapeHtml;
  const button = input.trackingUrl
    ? `<tr><td align="center" style="padding:24px 0;">
         <a href="${e(input.trackingUrl)}" style="display:inline-block;background:#dc2626;color:#ffffff;font:700 18px/1.2 Arial,Helvetica,sans-serif;text-decoration:none;padding:18px 34px;border-radius:14px;">🔴 View Live Location</a>
       </td></tr>`
    : "";
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 0;font:14px/1.5 Arial,Helvetica,sans-serif;color:#334155;"><strong>${e(label)}:</strong> ${e(value)}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;padding:28px;">
      <tr><td style="font:800 22px/1.3 Arial,Helvetica,sans-serif;color:#b91c1c;">🚨 RESQORA Emergency Alert</td></tr>
      <tr><td style="padding-top:10px;font:15px/1.6 Arial,Helvetica,sans-serif;color:#0f172a;">
        <strong>${e(input.name)}</strong> has activated an Emergency SOS and may need immediate assistance.
      </td></tr>
      ${button}
      <tr><td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${row("User name", input.name)}
          ${row("Emergency time", input.time)}
          ${row("Current address", input.address)}
          ${row("Status", input.status)}
          ${row("Emergency ID", input.reference)}
          <tr><td style="padding:6px 0;font:14px/1.5 Arial,Helvetica,sans-serif;color:#334155;">
            <strong>Google Maps:</strong> <a href="${e(input.mapLink)}" style="color:#1d4ed8;">${e(input.mapLink)}</a>
          </td></tr>
          ${row("Support contact", input.supportContact)}
        </table>
      </td></tr>
      <tr><td style="padding-top:20px;border-top:1px solid #e2e8f0;font:12px/1.5 Arial,Helvetica,sans-serif;color:#64748b;">
        RESQORA — Every Second Matters. Every Life Connected.<br/>
        This link stops updating automatically once the emergency is resolved.
      </td></tr>
    </table>
  </td></tr>
</table>`;
}

/** The exact EmailJS template parameters used by every RESQORA alert. */
export function buildTemplateParams(input: {
  toEmail: string;
  emergency: Emergency;
  profile: Profile | null | undefined;
  address?: string | null;
  trackingUrl?: string | null;
}): EmergencyTemplateParams {
  const coords = coordsOf(input.emergency);
  const name = input.profile?.full_name || "An RESQORA user";
  const address =
    input.address ||
    input.emergency.address ||
    input.profile?.home_address ||
    "Address unavailable";
  const mapLink = coords ? mapsLink(coords) : "Pending location capture";
  const time = new Date().toLocaleString();
  const reference = input.emergency.id.slice(0, 8).toUpperCase();
  const status = statusLine(input.emergency);
  const support = input.profile?.phone || input.profile?.email || "support@resqora.app";
  return {
    to_email: input.toEmail,
    user_name: name,
    time,
    address,
    map_link: mapLink,
    tracking_link: input.trackingUrl || "Not available",
    emergency_id: reference,
    reply_to: input.profile?.email || input.profile?.phone || "no-reply@resqora.app",
    status,
    support_contact: support,
    message_html: buildEmergencyEmailHtml({
      name,
      time,
      address,
      mapLink,
      trackingUrl: input.trackingUrl ?? null,
      reference,
      status,
      supportContact: support,
    }),
  };
}

export type EmailDeliveryOutcome = {
  id: string;
  name: string;
  email: string;
  ok: boolean;
  attempts: number;
  error?: string;
};

/**
 * Sends the emergency email to every trusted contact through EmailJS and
 * records each attempt in the database. Returns false for `configured` when the
 * EmailJS environment variables are missing.
 */
export async function dispatchEmailAlerts(input: {
  deliveries: AlertDelivery[];
  emergency: Emergency;
  profile: Profile | null | undefined;
  address?: string | null;
  trackingUrl?: string | null;
}): Promise<{ configured: boolean; results: EmailDeliveryOutcome[] }> {
  const targets = input.deliveries.filter((d) => d.contact_email && d.status !== "delivered");
  if (!isEmailConfigured()) {
    await Promise.all(
      targets.map((d) =>
        supabase
          .from("emergency_alert_deliveries")
          .update({ status: "failed", error: EMAIL_NOT_CONFIGURED })
          .eq("id", d.id),
      ),
    );
    return { configured: false, results: [] };
  }
  const results = await Promise.all(
    targets.map(async (delivery) => {
      const result = await sendAndRecord({
        deliveryId: delivery.id,
        params: buildTemplateParams({
          toEmail: delivery.contact_email!,
          emergency: input.emergency,
          profile: input.profile,
          address: input.address,
          trackingUrl: input.trackingUrl,
        }),
      });
      return {
        id: delivery.id,
        name: delivery.contact_name,
        email: delivery.contact_email!,
        ok: result.ok,
        attempts: result.attempts,
        error: result.ok ? undefined : result.error,
      } satisfies EmailDeliveryOutcome;
    }),
  );
  return { configured: true, results };
}

/** One call: seed rows + send + log. Used by the SOS workflow and share centre. */
export async function sendEmergencyEmailAlerts(input: {
  userId: string;
  emergency: Emergency;
  profile: Profile | null | undefined;
  contacts: EmergencyContact[];
  address?: string | null;
  trackingUrl?: string | null;
  kind?: "alert" | "resolved";
}) {
  const targets = contactsWithEmail(input.contacts);
  if (targets.length === 0) {
    return {
      sent: 0,
      failed: 0,
      configured: true,
      skipped: true,
      results: [] as EmailDeliveryOutcome[],
    };
  }
  const deliveries = await seedEmailDeliveries({
    userId: input.userId,
    emergencyId: input.emergency.id,
    contacts: targets,
    kind: input.kind,
  });
  const { configured, results } = await dispatchEmailAlerts({
    deliveries,
    emergency: input.emergency,
    profile: input.profile,
    address: input.address,
    trackingUrl: input.trackingUrl,
  });
  return {
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    configured,
    skipped: false,
    results,
  };
}
