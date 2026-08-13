/* global importScripts, firebase */
/**
 * RESQORA Firebase Cloud Messaging worker.
 *
 * This worker only handles background push notifications — it never caches app
 * HTML or assets (the Workbox worker at /sw.js owns offline caching). The
 * Firebase web config is fetched from the app's public config endpoint so no
 * keys are hardcoded here.
 */
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

const ready = fetch("/api/public/push-config")
  .then((response) => response.json())
  .then((payload) => {
    if (!payload || !payload.configured) return null;
    firebase.initializeApp(payload.config);
    return firebase.messaging();
  })
  .catch(() => null);

ready.then((messaging) => {
  if (!messaging) return;
  messaging.onBackgroundMessage((payload) => {
    const data = payload.data || {};
    const title = data.title || "RESQORA Emergency";
    self.registration.showNotification(title, {
      body: data.body || "Open RESQORA for the latest emergency status.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag || "resqora-emergency",
      renotify: true,
      requireInteraction: data.kind === "sos" || data.kind === "guardian",
      data: { url: data.url || "/dashboard" },
    });
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/dashboard";
  event.waitUntil(
    (async () => {
      const url = new URL(target, self.location.origin).href;
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clients) {
        if (client.url === url) return client.focus();
      }
      const existing = clients[0];
      if (existing && "navigate" in existing) {
        await existing.focus();
        return existing.navigate(url);
      }
      return self.clients.openWindow(url);
    })(),
  );
});