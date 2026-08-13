import { createFileRoute } from "@tanstack/react-router";

/**
 * Publishable Firebase web config for the browser messaging client and the
 * messaging service worker. These values are safe to expose (they identify the
 * Firebase project, they do not authorise sending). The service-account key
 * used for actually sending pushes never leaves the server.
 */
export const Route = createFileRoute("/api/public/push-config")({
  server: {
    handlers: {
      GET: async () => {
        const config = {
          apiKey: process.env["FIREBASE_API_KEY"] ?? "",
          authDomain: process.env["FIREBASE_AUTH_DOMAIN"] ?? "",
          projectId: process.env["FIREBASE_PROJECT_ID"] ?? "",
          messagingSenderId: process.env["FIREBASE_MESSAGING_SENDER_ID"] ?? "",
          appId: process.env["FIREBASE_APP_ID"] ?? "",
        };
        const vapidKey = process.env["FIREBASE_VAPID_KEY"] ?? "";
        const configured = Boolean(
          config.apiKey && config.projectId && config.messagingSenderId && config.appId && vapidKey,
        );
        return new Response(JSON.stringify({ configured, config, vapidKey }), {
          headers: {
            "content-type": "application/json",
            "cache-control": "public, max-age=300",
          },
        });
      },
    },
  },
});
