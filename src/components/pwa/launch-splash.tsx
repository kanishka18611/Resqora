import { useEffect, useState } from "react";

const HOLD_MS = 900;
const FADE_MS = 400;
/** The logo's own background field — matching it hides the image edges. */
const SPLASH_BG = "#f7f9fc";

/**
 * Installed-app launch splash. Android/iOS paint a system splash first (manifest
 * icon / apple-touch-startup-image), then the shell needs a beat to hydrate —
 * this bridges that gap with the official RESQORA logo instead of a blank frame,
 * then fades into Home. Runs only in standalone (installed) mode; the logo is a
 * static local file so it paints instantly and works with no connectivity.
 */
export function LaunchSplash() {
  const [phase, setPhase] = useState<"hidden" | "shown" | "leaving">("hidden");

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (!standalone) return;
    setPhase("shown");
    const leave = window.setTimeout(() => setPhase("leaving"), HOLD_MS);
    const done = window.setTimeout(() => setPhase("hidden"), HOLD_MS + FADE_MS);
    return () => {
      window.clearTimeout(leave);
      window.clearTimeout(done);
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      aria-hidden="true"
      style={{ transitionDuration: `${FADE_MS}ms`, backgroundColor: SPLASH_BG }}
      className={`fixed inset-0 z-[100] grid place-items-center px-8 transition-opacity motion-reduce:transition-none ${
        phase === "leaving" ? "opacity-0" : "opacity-100"
      }`}
    >
      <picture>
        <source srcSet="/brand/resqora-logo.webp" type="image/webp" />
        <img
          src="/brand/resqora-logo.png"
          alt="RESQORA — Emergency Response"
          width={827}
          height={707}
          decoding="sync"
          className="h-auto w-full max-w-[280px] sm:max-w-[340px] lg:max-w-[400px]"
        />
      </picture>
    </div>
  );
}
