import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    tanstackStart(),
    TanStackRouterVite(),
    react(),
    tailwindcss(),
    VitePWA({
      strategies: "generateSW",
      registerType: "autoUpdate",
      // src/lib/register-sw.ts is the only registrar (guards out preview/dev).
      injectRegister: null,
      devOptions: { enabled: false },
      filename: "sw.js",
      manifest: false,
      workbox: {
        // The client build lands in dist/client while Vite's outDir is dist, so
        // without these the worker is written outside the served directory and
        // /sw.js 404s in production (with precache URLs prefixed "client/").
        globDirectory: "dist/client",
        swDest: "dist/client/sw.js",
        globPatterns: ["**/*.{js,css,html,png,jpg,webp,svg,ico,woff2,webmanifest}"],
        // The FCM worker is a separate registration and must never be precached.
        // iOS launch images are painted by Safari before the SW is involved, so
        // precaching ~800 KB of them would only slow the first install.
        globIgnores: ["**/firebase-messaging-sw.js", "brand/splash-*.jpg"],
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: { cacheName: "resqora-pages", networkTimeoutSeconds: 5 },
          },
          {
            urlPattern: ({ request, sameOrigin }) =>
              sameOrigin && ["script", "style", "font", "image"].includes(request.destination),
            handler: "CacheFirst",
            options: {
              cacheName: "resqora-assets",
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
});
