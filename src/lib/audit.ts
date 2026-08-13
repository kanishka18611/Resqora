import { supabase } from "@/integrations/supabase/client";

/**
 * Security audit trail. Events are written through a database function so an
 * event can be recorded even before sign-in (e.g. a failed attempt) while the
 * owner of the event is always taken from the verified session — never the
 * client. Rows are read-only for the user and readable by admins.
 */
export type SecurityEvent =
  | "Sign-in succeeded"
  | "Sign-in failed"
  | "Sign-up requested"
  | "Password reset requested"
  | "Password changed"
  | "Signed out"
  | "SOS activated"
  | "SOS deactivated"
  | "Emergency contacts changed"
  | "Profile updated"
  | "Guardian changed"
  | "Share link revoked"
  | "Share link rotated"
  | "RESQR ID regenerated"
  | "Admin action";

export async function logSecurityEvent(
  event: SecurityEvent,
  detail?: string,
  metadata?: Record<string, unknown>,
) {
  try {
    await supabase.rpc("log_security_event", {
      _event: event,
      _detail: detail ? detail.slice(0, 500) : undefined,
      _metadata: (metadata ?? {}) as never,
      _user_agent: typeof navigator === "undefined" ? undefined : navigator.userAgent.slice(0, 300),
    });
  } catch {
    /* audit logging must never break a user action */
  }
}
