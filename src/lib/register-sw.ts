/**
 * Guarded service-worker registration. Offline caching must never run inside
 * the Lovable editor preview, an iframe, or dev — stale HTML there would serve
 * deleted chunks. `?sw=off` acts as a kill switch.
 */
function shouldRegister() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return false;
  if (!import.meta.env.PROD) return false;
  if (window.self !== window.top) return false;
  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return false;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return false;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return false;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return false;
  if (new URLSearchParams(window.location.search).has("sw")) {
    return new URLSearchParams(window.location.search).get("sw") !== "off";
  }
  return true;
}

async function unregisterAppWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    registrations
      .filter((registration) => (registration.active?.scriptURL ?? "").endsWith("/sw.js"))
      .map((registration) => registration.unregister()),
  );
}

export function registerServiceWorker() {
  if (!shouldRegister()) {
    void unregisterAppWorker();
    return;
  }
  void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
    /* offline support is best-effort */
  });
}
