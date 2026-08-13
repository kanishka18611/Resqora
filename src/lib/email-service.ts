/**
 * RESQORA email transport — official EmailJS browser SDK.
 *
 * Modular by design: any feature (SOS alerts, Guardian Mode, future
 * notifications) calls `sendEmergencyTemplateEmail` with the shared template
 * parameters and gets a confirmed result back from EmailJS.
 */
import emailjs from "@emailjs/browser";
import { supabase } from "@/integrations/supabase/client";

export const EMAIL_NOT_CONFIGURED = "Email service is not configured.";

export type EmailConfig = {
  publicKey: string;
  serviceId: string;
  templateId: string;
};

/** Exact template parameter contract shared by every RESQORA email. */
export type EmergencyTemplateParams = {
  to_email: string;
  user_name: string;
  time: string;
  address: string;
  map_link: string;
  tracking_link: string;
  emergency_id: string;
  reply_to: string;
  /** Human status line, e.g. "🔴 Emergency active". */
  status?: string;
  /** Support / reply-to contact shown in the email footer. */
  support_contact?: string;
  /** Ready-made HTML body with the big “🔴 View Live Location” button. */
  message_html?: string;
};

export function emailConfigParts() {
  const env = import.meta.env as Record<string, string | undefined>;
  return {
    publicKey: (env.VITE_EMAILJS_PUBLIC_KEY ?? "").trim(),
    serviceId: (env.VITE_EMAILJS_SERVICE_ID ?? "").trim(),
    templateId: (env.VITE_EMAILJS_TEMPLATE_ID ?? "").trim(),
  };
}

export function emailConfig(): EmailConfig | null {
  const parts = emailConfigParts();
  if (!parts.publicKey || !parts.serviceId || !parts.templateId) return null;
  return parts as EmailConfig;
}

export function isEmailConfigured() {
  return emailConfig() !== null;
}

/** Human list of the missing pieces, used by the diagnostics page. */
export function missingEmailConfig() {
  const parts = emailConfigParts();
  const missing: string[] = [];
  if (!parts.publicKey) missing.push("VITE_EMAILJS_PUBLIC_KEY");
  if (!parts.serviceId) missing.push("VITE_EMAILJS_SERVICE_ID");
  if (!parts.templateId) missing.push("VITE_EMAILJS_TEMPLATE_ID");
  return missing;
}

let initialised = false;

/** Initialises the SDK once per session. Returns false when unconfigured. */
export function initEmailService() {
  const config = emailConfig();
  if (!config) return false;
  if (!initialised) {
    emailjs.init({ publicKey: config.publicKey });
    initialised = true;
  }
  return true;
}

export function isEmailInitialised() {
  return initialised;
}

export function isValidEmail(value: string | null | undefined) {
  return Boolean(value && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()));
}

/* ------------------------------- diagnostics ------------------------------- */

const DIAG_KEY = "resqora.email.diagnostics";

export type EmailDiagnostics = {
  lastSentAt?: string;
  lastRecipient?: string;
  lastError?: string;
  lastErrorAt?: string;
  attempts?: number;
};

export function readEmailDiagnostics(): EmailDiagnostics {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(DIAG_KEY) ?? "{}") as EmailDiagnostics;
  } catch {
    return {};
  }
}

function writeEmailDiagnostics(patch: EmailDiagnostics) {
  if (typeof window === "undefined") return;
  const next = { ...readEmailDiagnostics(), ...patch };
  next.attempts = (readEmailDiagnostics().attempts ?? 0) + 1;
  window.localStorage.setItem(DIAG_KEY, JSON.stringify(next));
}

/* --------------------------------- sending -------------------------------- */

export type EmailSendResult =
  { ok: true; attempts: number } | { ok: false; attempts: number; error: string };

function errorText(error: unknown) {
  if (!error) return "Unknown EmailJS error";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  const shaped = error as { status?: number; text?: string; message?: string };
  if (shaped.text) return `EmailJS ${shaped.status ?? ""} ${shaped.text}`.trim();
  return shaped.message ?? JSON.stringify(error);
}

/**
 * Sends one email through EmailJS. Validates configuration and recipient first,
 * then retries twice more (three attempts total) before giving up.
 */
export async function sendEmergencyTemplateEmail(
  params: EmergencyTemplateParams,
  options: { attempts?: number } = {},
): Promise<EmailSendResult> {
  const config = emailConfig();
  if (!config) {
    writeEmailDiagnostics({
      lastError: EMAIL_NOT_CONFIGURED,
      lastErrorAt: new Date().toISOString(),
    });
    return { ok: false, attempts: 0, error: EMAIL_NOT_CONFIGURED };
  }
  if (!initEmailService()) {
    return { ok: false, attempts: 0, error: EMAIL_NOT_CONFIGURED };
  }
  if (!isValidEmail(params.to_email)) {
    return {
      ok: false,
      attempts: 0,
      error: `Invalid recipient email: ${params.to_email || "empty"}`,
    };
  }

  const maxAttempts = options.attempts ?? 3;
  let lastError = "Unknown EmailJS error";
  const recipient = params.to_email.trim();
  // The recipient is always the dynamic value passed in here. Aliases cover the
  // common EmailJS "To Email" template variable names so the template can never
  // fall back to a static/default account address.
  const payload: Record<string, unknown> = {
    ...params,
    to_email: recipient,
    email: recipient,
    to: recipient,
    recipient,
    user_email: recipient,
  };
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await emailjs.send(config.serviceId, config.templateId, payload, {
        publicKey: config.publicKey,
      });
      writeEmailDiagnostics({
        lastSentAt: new Date().toISOString(),
        lastRecipient: recipient,
      });
      return { ok: true, attempts: attempt };
    } catch (error) {
      lastError = errorText(error);
      if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, attempt * 800));
    }
  }
  writeEmailDiagnostics({ lastError, lastErrorAt: new Date().toISOString() });
  return { ok: false, attempts: maxAttempts, error: lastError };
}

/**
 * Sends the email and records the attempt against an existing delivery row so
 * every emergency keeps a full audit trail (recipient, status, time, error).
 */
export async function sendAndRecord(input: {
  deliveryId: string;
  params: EmergencyTemplateParams;
}): Promise<EmailSendResult> {
  const result = await sendEmergencyTemplateEmail(input.params);
  const { error } = await supabase
    .from("emergency_alert_deliveries")
    .update({
      channel: "email",
      status: result.ok ? "delivered" : "failed",
      error: result.ok ? null : result.error,
      sent_at: result.ok ? new Date().toISOString() : null,
    })
    .eq("id", input.deliveryId);
  if (error) console.error("RESQORA email log failed:", error.message);
  return result;
}
