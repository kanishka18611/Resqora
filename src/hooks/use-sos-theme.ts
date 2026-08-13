import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { activeEmergencyQuery } from "@/lib/api";

/**
 * Flips the whole app into the emergency red theme while an SOS is live by
 * setting data-sos="active" on <html>. Reverts automatically on resolve/cancel.
 */
export function useSosTheme() {
  const { user } = useAuth();
  const active = useQuery(activeEmergencyQuery(user?.id));
  const emergency = active.data ?? null;
  const live = Boolean(
    emergency && emergency.status !== "resolved" && emergency.status !== "cancelled",
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (live) root.dataset.sos = "active";
    else delete root.dataset.sos;
    return () => {
      delete root.dataset.sos;
    };
  }, [live]);

  return { live, emergency };
}
