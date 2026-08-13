/**
 * Server-side FCM HTTP v1 sender. Uses the Firebase service account to mint a
 * short-lived OAuth token (RS256 JWT signed with WebCrypto so it runs on the
 * edge runtime), then delivers data-only messages to each of a user's active
 * devices. Tokens rejected as unregistered/invalid are deactivated so expired
 * devices stop being retried.
 */

type ServiceAccount = { client_email: string; private_key: string; project_id: string };

export type { PushMessage } from "@/lib/push-messages";
import type { PushMessage } from "@/lib/push-messages";

function serviceAccount(): ServiceAccount | null {
  const raw = process.env["FIREBASE_SERVICE_ACCOUNT_JSON"];
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ServiceAccount;
    if (!parsed.client_email || !parsed.private_key || !parsed.project_id) return null;
    return parsed;
  } catch {
    return null;
  }
}

function base64Url(input: ArrayBuffer | string) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importPrivateKey(pem: string) {
  const body = pem
    .replace(/\\n/g, "\n")
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const der = Uint8Array.from(atob(body), (char) => char.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(account: ServiceAccount) {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(
    JSON.stringify({
      iss: account.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const key = await importPrivateKey(account.private_key);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(`${header}.${claims}`),
  );
  const assertion = `${header}.${claims}.${base64Url(signature)}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!response.ok) throw new Error(`Firebase auth failed (${response.status})`);
  const payload = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: payload.access_token,
    expiresAt: Date.now() + payload.expires_in * 1000,
  };
  return cachedToken.value;
}

/** Sends one message to every active device of a user. Never throws. */
export async function sendPushToUser(userId: string, message: PushMessage) {
  const account = serviceAccount();
  if (!account) return { sent: 0, failed: 0, configured: false as const };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: profile }, { data: tokens }] = await Promise.all([
    supabaseAdmin.from("profiles").select("notify_push").eq("id", userId).maybeSingle(),
    supabaseAdmin.from("push_tokens").select("token").eq("user_id", userId).eq("active", true),
  ]);
  if (profile && profile.notify_push === false) {
    return { sent: 0, failed: 0, configured: true as const, disabled: true as const };
  }
  if (!tokens || tokens.length === 0) return { sent: 0, failed: 0, configured: true as const };

  const bearer = await accessToken(account);
  const endpoint = `https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`;
  const expired: string[] = [];
  let sent = 0;
  let failed = 0;

  await Promise.all(
    tokens.map(async ({ token }) => {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { authorization: `Bearer ${bearer}`, "content-type": "application/json" },
          body: JSON.stringify({
            message: {
              token,
              // Data-only: the worker renders the notification so taps can route.
              data: {
                title: message.title,
                body: message.body,
                url: message.url,
                tag: message.tag,
                kind: message.kind,
              },
              webpush: {
                headers: { Urgency: "high", TTL: "600" },
                fcm_options: { link: message.url },
              },
              android: { priority: "high" },
            },
          }),
        });
        if (response.ok) {
          sent += 1;
          return;
        }
        failed += 1;
        const text = await response.text();
        if (response.status === 404 || /UNREGISTERED|INVALID_ARGUMENT/i.test(text)) {
          expired.push(token);
        }
      } catch {
        failed += 1;
      }
    }),
  );

  if (expired.length > 0) {
    await supabaseAdmin.from("push_tokens").update({ active: false }).in("token", expired);
  }
  return { sent, failed, configured: true as const, expired: expired.length };
}
