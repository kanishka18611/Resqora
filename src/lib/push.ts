/**
 * Browser notification helpers. RESQORA uses the Notification API directly so
 * reminders and emergency updates work without a third-party push provider.
 */

export function pushSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function pushPermission(): NotificationPermission | "unsupported" {
  if (!pushSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestPushPermission() {
  if (!pushSupported()) return "unsupported" as const;
  if (Notification.permission === "granted") return "granted" as const;
  const result = await Notification.requestPermission();
  return result;
}

export function showPush(title: string, body?: string, tag?: string) {
  if (!pushSupported() || Notification.permission !== "granted") return false;
  try {
    new Notification(title, {
      body,
      tag,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    });
    return true;
  } catch {
    return false;
  }
}
