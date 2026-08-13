import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, Copy, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Emergency, EmergencyContact, Profile } from "@/lib/api";
import { deliveriesQuery } from "@/lib/alert-delivery";
import { copyText } from "@/lib/alerts";
import { logActivity } from "@/lib/activity";
import {
  buildWhatsappAlert,
  contactsWithPhone,
  logWhatsappAttempt,
  prepareWhatsappShares,
  whatsappShareLink,
} from "@/lib/whatsapp-alerts";

/**
 * WhatsApp cannot be delivered server-side without a paid Business API, so
 * RESQORA prepares a fully written message per contact, opens WhatsApp with it
 * pre-filled, and records every attempt (success or failure) in the database.
 */
export function WhatsappShareStatus({
  emergency,
  profile,
  contacts,
  trackingUrl,
  address,
}: {
  emergency: Emergency;
  profile: Profile | null | undefined;
  contacts: EmergencyContact[];
  trackingUrl?: string | null;
  address?: string | null;
}) {
  const queryClient = useQueryClient();
  const deliveries = useQuery(deliveriesQuery(emergency.id));
  const [busy, setBusy] = useState<string | null>(null);
  const reachable = contactsWithPhone(contacts);
  const rows = (deliveries.data ?? []).filter((row) => row.channel === "whatsapp");
  const message = buildWhatsappAlert({ emergency, profile, address, trackingUrl });

  // Make sure every contact with a phone has a prepared message row.
  useEffect(() => {
    if (reachable.length === 0 || deliveries.isLoading) return;
    if (rows.length >= reachable.length) return;
    void prepareWhatsappShares({
      userId: emergency.user_id,
      emergencyId: emergency.id,
      contacts: reachable,
    })
      .then(() => queryClient.invalidateQueries({ queryKey: ["alert-deliveries", emergency.id] }))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emergency.id, reachable.length, rows.length, deliveries.isLoading]);

  async function copyMessage() {
    await copyText(message);
    toast.success("Emergency message copied — paste it into WhatsApp");
  }

  async function copyTracking() {
    if (!trackingUrl) {
      toast.error("Live tracking link is not ready yet");
      return;
    }
    await copyText(trackingUrl);
    toast.success("Live tracking link copied");
  }

  async function share(id: string, name: string, phone: string | null) {
    setBusy(id);
    try {
      const { href, problem } = whatsappShareLink(message, phone, profile?.phone);
      if (!href) {
        await logWhatsappAttempt({ deliveryId: id, ok: false, error: problem });
        toast.error(problem ?? "This number cannot be used for WhatsApp");
        return;
      }
      const opened = window.open(href, "_blank", "noopener,noreferrer");
      if (!opened) {
        await logWhatsappAttempt({
          deliveryId: id,
          ok: false,
          error: "Unable to open WhatsApp.",
        });
        await copyText(message);
        toast.error("Unable to open WhatsApp. The emergency message was copied instead.");
        return;
      }
      await logWhatsappAttempt({ deliveryId: id, ok: true });
      await logActivity(emergency.user_id, "WhatsApp alert shared", name);
      toast.success(`WhatsApp opened for ${name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not record the WhatsApp share");
    } finally {
      setBusy(null);
      await queryClient.invalidateQueries({ queryKey: ["alert-deliveries", emergency.id] });
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <MessageCircle className="size-4 text-success" aria-hidden="true" />
          WhatsApp alerts
        </h2>
        <Badge variant="outline" className="rounded-full text-[10px]">
          {rows.filter((row) => row.status === "delivered").length} of {reachable.length} shared
        </Badge>
      </div>

      {reachable.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Add a phone number to your trusted contacts to unlock WhatsApp alerts.
        </p>
      ) : (
        <>
          <p className="mt-2 text-xs text-muted-foreground">
            Each message is fully written with your live location and tracking link — tap a contact
            to open WhatsApp and press send.
          </p>
          <ul className="mt-3 space-y-2">
            {rows.map((row) => {
              const check = whatsappShareLink(message, row.contact_phone, profile?.phone);
              return (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/60 px-3 py-2 text-xs"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-foreground">
                      {row.contact_name}
                    </span>
                    <span className="block truncate text-muted-foreground">
                      {row.contact_phone}
                    </span>
                    {check.problem ? (
                      <span className="mt-1 flex items-center gap-1 text-alert">
                        <AlertTriangle className="size-3" aria-hidden="true" />
                        {check.problem}
                      </span>
                    ) : null}
                    {row.status === "failed" && row.error ? (
                      <span className="mt-1 block text-alert">✗ {row.error}</span>
                    ) : null}
                  </span>
                  <span className="flex items-center gap-2">
                    {row.status === "delivered" ? (
                      <span className="flex items-center gap-1 font-semibold text-success">
                        <Check className="size-3" aria-hidden="true" />
                        Shared
                        {row.sent_at ? ` · ${new Date(row.sent_at).toLocaleTimeString()}` : ""}
                      </span>
                    ) : (
                      <span className="font-semibold text-muted-foreground">Ready to send</span>
                    )}
                    <Button
                      size="sm"
                      variant={row.status === "delivered" ? "outline" : "hero"}
                      disabled={busy === row.id}
                      onClick={() => share(row.id, row.contact_name, row.contact_phone)}
                    >
                      {busy === row.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <MessageCircle className="size-4" />
                      )}
                      WhatsApp {row.contact_name.split(" ")[0]}
                    </Button>
                  </span>
                </li>
              );
            })}
            {rows.length === 0 && (
              <li className="text-xs text-muted-foreground">Preparing WhatsApp messages…</li>
            )}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={copyMessage}>
              <Copy className="size-4" />
              Copy emergency message
            </Button>
            <Button size="sm" variant="outline" onClick={copyTracking}>
              <Copy className="size-4" />
              Copy live tracking link
            </Button>
          </div>
          <details className="mt-3 rounded-xl border border-border p-3">
            <summary className="cursor-pointer text-xs font-medium text-primary">
              Preview the WhatsApp message
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-foreground">
              {message}
            </pre>
          </details>
        </>
      )}
    </div>
  );
}
