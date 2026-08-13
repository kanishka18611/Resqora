import { useEffect } from "react";
import { WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOfflineSync } from "@/hooks/use-offline-sync";

/**
 * Global connectivity notice. While offline it warns that emergency features are
 * limited; on reconnect it flushes anything captured offline (handled by
 * useOfflineSync) and asks Supabase Realtime to re-establish its socket once —
 * `connect()` is a no-op when the socket is already open, so no duplicate
 * subscriptions or replayed events.
 */
export function ConnectionBanner() {
  const { offline, pending } = useOfflineSync();

  useEffect(() => {
    if (offline) return;
    const socket = supabase.realtime;
    if (!socket.isConnected()) socket.connect();
  }, [offline]);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-alert px-4 py-2 text-center text-xs font-semibold text-alert-foreground"
    >
      <WifiOff className="size-4 shrink-0" aria-hidden="true" />
      <span>Connection lost — emergency features may be limited.</span>
      {pending > 0 && <span className="font-normal opacity-90">({pending} queued)</span>}
    </div>
  );
}
