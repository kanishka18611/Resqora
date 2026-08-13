import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

const DISMISS_KEY = "resqora.install.dismissed";

function isIos() {
  const ua = window.navigator.userAgent;
  const iPadOs = /Macintosh/.test(ua) && "ontouchend" in document;
  return /iPad|iPhone|iPod/.test(ua) || iPadOs;
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

/**
 * Install prompt. On Chrome/Edge (Android, Windows, macOS) it uses the real
 * `beforeinstallprompt` event. On iOS/iPadOS Safari — which has no programmatic
 * install — it shows the Share → Add to Home Screen instructions instead. It
 * never appears once RESQORA runs standalone or after the user dismisses it.
 */
export function InstallPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (window.localStorage.getItem(DISMISS_KEY)) return;
    if (isIos()) {
      // Safari offers no event; surface the manual steps after the app settles.
      const timer = window.setTimeout(() => setIosHint(true), 2500);
      return () => window.clearTimeout(timer);
    }
    const handler = (incoming: Event) => {
      incoming.preventDefault();
      setEvent(incoming as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    const installed = () => setEvent(null);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  if (!event && !iosHint) return null;

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setEvent(null);
    setIosHint(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Install RESQORA"
      className="glass-panel fixed inset-x-3 bottom-3 z-[70] flex items-center gap-3 rounded-2xl p-3 shadow-lg sm:left-auto sm:right-4 sm:w-96"
    >
      <img src="/icons/icon-192.png" alt="" className="size-10 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">Install RESQORA</p>
        {iosHint ? (
          <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            Tap <Share className="size-3.5 shrink-0" aria-hidden="true" /> Share, then
            <span className="font-medium text-foreground">Add to Home Screen</span>.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            One-tap SOS from your home screen, even on a weak connection.
          </p>
        )}
      </div>
      {event && (
        <Button
          size="sm"
          onClick={async () => {
            try {
              await event.prompt();
              await event.userChoice;
            } catch {
              /* the browser may have already dismissed the prompt */
            }
            setEvent(null);
          }}
        >
          <Download className="size-4" aria-hidden="true" />
          Install
        </Button>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:text-foreground"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
