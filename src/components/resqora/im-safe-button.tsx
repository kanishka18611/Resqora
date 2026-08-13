import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/system/confirm-modal";
import type { Emergency, EmergencyContact, Profile } from "@/lib/api";
import { confirmSafe } from "@/lib/emergency";

/** Prominent one-tap resolution: stops tracking, closes the session, tells contacts. */
export function ImSafeButton({
  emergency,
  profile,
  contacts,
}: {
  emergency: Emergency;
  profile: Profile | null | undefined;
  contacts: EmergencyContact[];
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <Button
        size="xl"
        variant="hero"
        className="w-full bg-linear-to-r from-success to-success/80 text-white shadow-lg shadow-success/30 hover:opacity-95"
        disabled={busy}
        onClick={() => setOpen(true)}
      >
        <ShieldCheck className="size-5" />
        I'm safe
      </Button>

      <ConfirmModal
        open={open}
        onOpenChange={setOpen}
        title="Confirm you are safe?"
        description="RESQORA will stop live tracking, close this emergency session and notify your trusted contacts that you are safe."
        confirmLabel="Yes, I'm safe"
        onConfirm={async () => {
          setOpen(false);
          setBusy(true);
          try {
            await confirmSafe({ emergency, profile, contacts });
            await queryClient.invalidateQueries();
            toast.success("Emergency closed — your contacts have been told you're safe");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not close the emergency");
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}
