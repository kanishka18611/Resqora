import { useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ShieldCheck, Siren } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/system/confirm-modal";
import { useAuth } from "@/hooks/use-auth";
import { activeEmergencyQuery, contactsQuery, profileQuery } from "@/lib/api";
import { confirmSafe } from "@/lib/emergency";
import { cn } from "@/lib/utils";

/**
 * Persistent one-tap SOS. Reuses the existing emergency workflow via
 * /emergency?auto=true (GPS capture, session creation, contact alerts, then
 * redirect to the live status page).
 */
export function GlobalSosButton() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = useQuery(activeEmergencyQuery(user?.id));
  const profile = useQuery(profileQuery(user?.id));
  const contacts = useQuery(contactsQuery(user?.id));
  const [confirm, setConfirm] = useState(false);
  const [stopping, setStopping] = useState(false);

  const emergency = active.data;
  const running = Boolean(emergency);

  async function startSos() {
    await navigate({ to: "/emergency", search: { auto: true } });
  }

  /** Stop SOS: ends tracking, closes the session and tells contacts you're safe. */
  async function stopSos() {
    if (!emergency) return;
    setStopping(true);
    try {
      await confirmSafe({
        emergency,
        profile: profile.data,
        contacts: contacts.data ?? [],
      });
      await queryClient.invalidateQueries();
      toast.success("SOS stopped — your contacts have been told you're safe");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not stop the SOS");
    } finally {
      setStopping(false);
    }
  }

  if (pathname === "/emergency") return null;

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center lg:inset-x-auto lg:bottom-8 lg:right-8 lg:justify-end">
        <div className="relative pointer-events-auto">
          <span
            aria-hidden="true"
            className={cn(
              "absolute inset-0 animate-ping rounded-full",
              running ? "bg-success/30" : "bg-alert/30",
            )}
          />
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            disabled={stopping}
            onClick={() => setConfirm(true)}
            aria-label={running ? "Stop the active emergency SOS" : "Trigger emergency SOS"}
            className={cn(
              "relative grid size-16 place-items-center rounded-full text-white shadow-2xl focus-visible:outline-none focus-visible:ring-4 lg:size-20",
              running
                ? "bg-linear-to-br from-success to-success/80 shadow-success/40 focus-visible:ring-success/40"
                : "bg-linear-to-br from-alert to-alert/80 shadow-alert/40 focus-visible:ring-alert/40",
            )}
          >
            <span className="flex flex-col items-center leading-none">
              {running ? (
                <ShieldCheck className="size-5 lg:size-6" aria-hidden="true" />
              ) : (
                <Siren className="size-5 lg:size-6" aria-hidden="true" />
              )}
              <span className="mt-1 font-display text-xs font-bold tracking-wide">
                {running ? "CANCEL" : "SOS"}
              </span>
            </span>
          </motion.button>
        </div>
      </div>

      <ConfirmModal
        open={confirm}
        onOpenChange={setConfirm}
        title={running ? "Stop the active SOS?" : "Send emergency SOS now?"}
        description={
          running
            ? "RESQORA will stop live location sharing, close the emergency session, record the end time and notify your trusted contacts that you are safe."
            : "RESQORA will capture your GPS location, start live tracking and alert your three trusted contacts immediately."
        }
        confirmLabel={running ? "Stop SOS — I'm safe" : "Send SOS"}
        onConfirm={async () => {
          setConfirm(false);
          if (running) await stopSos();
          else await startSos();
        }}
      />
    </>
  );
}
