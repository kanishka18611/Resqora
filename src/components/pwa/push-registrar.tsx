import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { profileQuery } from "@/lib/api";
import { listenForForegroundPush, registerPushDevice } from "@/lib/fcm";

/**
 * Registers the signed-in user's device for emergency push after login and
 * routes foreground notification taps to the right emergency screen.
 */
export function PushRegistrar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: profile } = useQuery(profileQuery(user?.id));
  const enabled = profile?.notify_push ?? true;

  useEffect(() => {
    if (!user || !enabled) return;
    let cleanup: (() => void) | undefined;
    void registerPushDevice(user.id).then(async (result) => {
      if (result.status !== "registered") return;
      cleanup = await listenForForegroundPush((url) => {
        if (url.startsWith("http")) {
          window.location.assign(url);
          return;
        }
        void navigate({ to: url });
      });
    });
    return () => cleanup?.();
  }, [user, enabled, navigate]);

  return null;
}
