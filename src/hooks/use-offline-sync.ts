import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isOffline, pendingCount, syncOfflineQueue } from "@/lib/offline";

/** Tracks connectivity and flushes anything captured offline once back online. */
export function useOfflineSync() {
  const queryClient = useQueryClient();
  const [offline, setOffline] = useState(false);
  const [pending, setPending] = useState(0);

  const flush = useCallback(async () => {
    const synced = await syncOfflineQueue();
    setPending(pendingCount());
    if (synced > 0) {
      toast.success(`${synced} offline emergency record${synced === 1 ? "" : "s"} synced`);
      await queryClient.invalidateQueries();
    }
  }, [queryClient]);

  useEffect(() => {
    setOffline(isOffline());
    setPending(pendingCount());
    const online = () => {
      setOffline(false);
      void flush();
    };
    const down = () => setOffline(true);
    window.addEventListener("online", online);
    window.addEventListener("offline", down);
    void flush();
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", down);
    };
  }, [flush]);

  return { offline, pending, flush };
}
