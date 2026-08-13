/**
 * Firebase Cloud Messaging client for RESQORA.
 *
 * Responsibilities: register the messaging worker, ask for permission, store the
 * device token in Supabase (RLS-scoped to the signed-in user), keep it fresh and
 * remove it when the user disables push from Settings. Every failure path is
 * non-fatal — emergency flows must never break because push is unavailable.
 */
import type { Messaging } from "firebase/messaging";
import { supabase } from "@/integrations/supabase/client";

const TOKEN_KEY = "resqora.fcm.token";

type PushConfig = {
  configured: boolean;
  config: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    messagingSenderId: string;
    appId: string;
  };
  vapidKey: string;
};

let configPromise: Promise<PushConfig | null> | null = null;
let messagingPromise: Promise<Messaging | null> | null = null;

export function pushEnvironmentSupported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

async function loadConfig() {
  configPromise ??= fetch("/api/public/push-config")
    .then((response) => (response.ok ? (response.json() as Promise<PushConfig>) : null))
    .catch(() => null);
  const config = await configPromise;
  return config?.configured ? config : null;
}

/** True when the Firebase project credentials are present on the server. */
export async function pushConfigured() {
  return Boolean(await loadConfig());
}

async function getMessaging() {
  if (!pushEnvironmentSupported()) return null;
  messagingPromise ??= (async () => {
    const config = await loadConfig();
    if (!config) return null;
    const [{ initializeApp, getApps }, { getMessaging: init, isSupported }] = await Promise.all([
      import("firebase/app"),
      import("firebase/messaging"),
    ]);
    if (!(await isSupported())) return null;
    const app = getApps()[0] ?? initializeApp(config.config);
    return init(app);
  })().catch(() => null);
  return messagingPromise;
}

async function messagingRegistration() {
  const existing = await navigator.serviceWorker.getRegistrations();
  const found = existing.find((registration) =>
    (registration.active?.scriptURL ?? registration.installing?.scriptURL ?? "").includes(
      "firebase-messaging-sw.js",
    ),
  );
  if (found) return found;
  return navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
}

async function storeToken(userId: string, token: string) {
  const { error } = await supabase.from("push_tokens").upsert(
    {
      user_id: userId,
      token,
      platform: "web",
      user_agent: navigator.userAgent.slice(0, 300),
      active: true,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "token" },
  );
  if (error) throw new Error(error.message);
  window.localStorage.setItem(TOKEN_KEY, token);
}

export type PushRegistrationResult =
  | { status: "registered"; token: string }
  | { status: "denied" }
  | { status: "unsupported" }
  | { status: "not-configured" }
  | { status: "failed"; error: string };

/**
 * Registers this device for emergency push. Safe to call repeatedly — FCM
 * returns the same token until it rotates, and rotation is upserted.
 */
export async function registerPushDevice(userId: string): Promise<PushRegistrationResult> {
  if (!pushEnvironmentSupported()) return { status: "unsupported" };
  const config = await loadConfig();
  if (!config) return { status: "not-configured" };

  let permission = Notification.permission;
  if (permission === "default") permission = await Notification.requestPermission();
  if (permission !== "granted") return { status: "denied" };

  try {
    const messaging = await getMessaging();
    if (!messaging) return { status: "unsupported" };
    const { getToken } = await import("firebase/messaging");
    const registration = await messagingRegistration();
    const token = await getToken(messaging, {
      vapidKey: config.vapidKey,
      serviceWorkerRegistration: registration,
    });
    if (!token) return { status: "failed", error: "Firebase returned no device token" };
    await storeToken(userId, token);
    return { status: "registered", token };
  } catch (error) {
    return { status: "failed", error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/** Turns push off for this device: deletes the FCM token and the stored row. */
export async function unregisterPushDevice(userId: string) {
  const token = typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY);
  try {
    const messaging = await getMessaging();
    if (messaging) {
      const { deleteToken } = await import("firebase/messaging");
      await deleteToken(messaging);
    }
  } catch {
    /* the stored row is deactivated regardless */
  }
  const query = supabase.from("push_tokens").update({ active: false }).eq("user_id", userId);
  await (token ? query.eq("token", token) : query);
  if (typeof window !== "undefined") window.localStorage.removeItem(TOKEN_KEY);
}

/**
 * Foreground handler: FCM does not raise a system notification while the tab is
 * focused, so RESQORA shows one itself and keeps taps routed to the emergency.
 */
export async function listenForForegroundPush(onOpen: (url: string) => void) {
  const messaging = await getMessaging();
  if (!messaging) return () => {};
  const { onMessage } = await import("firebase/messaging");
  return onMessage(messaging, (payload) => {
    const data = payload.data ?? {};
    if (Notification.permission !== "granted") return;
    try {
      const notification = new Notification(data["title"] ?? "RESQORA Emergency", {
        body: data["body"] ?? "Open RESQORA for the latest emergency status.",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: data["tag"] ?? "resqora-emergency",
      });
      notification.onclick = () => {
        window.focus();
        onOpen(data["url"] ?? "/dashboard");
        notification.close();
      };
    } catch {
      /* notification display is best-effort */
    }
  });
}
