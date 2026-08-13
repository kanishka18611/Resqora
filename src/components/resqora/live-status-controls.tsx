import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Ambulance, CheckCircle2, HeartPulse, Radio, Siren, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { contactsQuery, logEvent, profileQuery, type Emergency } from "@/lib/api";
import { cancelEmergency, resolveEmergency } from "@/lib/emergency";
import { logActivity } from "@/lib/activity";
import { showPush } from "@/lib/push";
import { cn } from "@/lib/utils";

export const LIVE_STATUSES = [
  { value: "need_help", label: "Need immediate help", icon: Siren },
  { value: "coordinating", label: "Services coordinating", icon: Radio },
  { value: "assistance_on_the_way", label: "Assistance on the way", icon: Ambulance },
  { value: "help_arrived", label: "Help arrived", icon: HeartPulse },
  { value: "safe", label: "I'm safe", icon: CheckCircle2 },
] as const;

export function LiveStatusControls({ emergency }: { emergency: Emergency }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const profile = useQuery(profileQuery(user?.id));
  const contacts = useQuery(contactsQuery(user?.id));
  const current = (emergency as Emergency & { live_status?: string }).live_status ?? "need_help";

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["active-emergency", user?.id] });
    await queryClient.invalidateQueries({ queryKey: ["emergencies", user?.id] });
    await queryClient.invalidateQueries({ queryKey: ["emergency-events", emergency.id] });
  }

  async function stopSharing() {
    await supabase
      .from("share_links")
      .update({ active: false })
      .eq("emergency_id", emergency.id)
      .eq("kind", "live");
  }

  async function setStatus(value: string, label: string) {
    setBusy(true);
    try {
      await supabase.from("emergencies").update({ live_status: value }).eq("id", emergency.id);
      await logEvent(emergency.id, emergency.user_id, label, "Status updated by the user.");
      if (value === "safe") {
        await resolveEmergency(emergency);
        await stopSharing();
        await logActivity(user?.id, "Emergency closed", "Marked safe — live sharing stopped");
      } else {
        await logActivity(user?.id, "Emergency status updated", label);
      }
      showPush("RESQORA status update", label);
      toast.success(label);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update status");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setBusy(true);
    try {
      // cancelEmergency owns the full close-out: tracking, timeline, history,
      // notifications and the resolved notice to every alerted contact.
      await cancelEmergency(emergency, {
        profile: profile.data,
        contacts: contacts.data ?? [],
      });
      await stopSharing();
      toast.success("Emergency cancelled");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not cancel the emergency");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        {LIVE_STATUSES.map((status) => (
          <Button
            key={status.value}
            variant={current === status.value ? "hero" : "outline"}
            disabled={busy}
            onClick={() => setStatus(status.value, status.label)}
            className={cn("justify-start", current === status.value && "ring-2 ring-primary/30")}
          >
            <status.icon className="size-4" />
            {status.label}
          </Button>
        ))}
      </div>
      <Button variant="ghost" disabled={busy} onClick={cancel} className="text-muted-foreground">
        <XCircle className="size-4" />
        Cancel emergency
      </Button>
    </div>
  );
}
