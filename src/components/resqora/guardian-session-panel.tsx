import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, ExternalLink, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/alerts";
import type { Emergency, EmergencyContact, Profile } from "@/lib/api";
import { guardianOf, guardianSessionQuery, guardianUrl, notifyGuardian } from "@/lib/guardian";

/** Guardian session status, secure dashboard link and manual re-send. */
export function GuardianSessionPanel({
  emergency,
  profile,
  contacts,
  trackingUrl,
}: {
  emergency: Emergency;
  profile: Profile | null | undefined;
  contacts: EmergencyContact[];
  trackingUrl?: string | null;
}) {
  const guardian = guardianOf(contacts);
  const session = useQuery(guardianSessionQuery(emergency.id));
  const [sending, setSending] = useState(false);
  const url = session.data ? guardianUrl(session.data) : null;

  if (!guardian) {
    return (
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
          Guardian mode
        </h2>
        <p className="mt-2 text-xs text-muted-foreground">
          No Guardian selected yet. Pick one of your trusted contacts on the profile page to give
          them a live emergency command dashboard.
        </p>
      </div>
    );
  }

  const send = async () => {
    setSending(true);
    try {
      const result = await notifyGuardian({
        userId: emergency.user_id,
        emergency,
        profile,
        guardian,
        address: emergency.address,
        trackingUrl,
      });
      await session.refetch();
      if (!result.configured)
        toast.error("Email service is not connected yet — share the link manually");
      else if (result.emailed) toast.success(`Guardian alert sent to ${guardian.name}`);
      else toast.message("Guardian dashboard ready — add an email for automatic delivery");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not notify the Guardian");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
          Guardian mode · {guardian.name}
        </h2>
        <Badge variant="outline" className="rounded-full text-[10px]">
          {url ? "Dashboard active" : "Not created yet"}
        </Badge>
      </div>
      {url && (
        <p className="mt-3 truncate rounded-xl bg-muted px-3 py-2 font-mono text-xs">{url}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="hero" onClick={send} disabled={sending}>
          <Send className="size-4" />
          {url ? "Resend Guardian alert" : "Notify Guardian"}
        </Button>
        {url && (
          <>
            <Button
              variant="outline"
              onClick={async () => {
                await copyText(url);
                toast.success("Guardian dashboard link copied");
              }}
            >
              <Copy className="size-4" />
              Copy link
            </Button>
            <Button asChild variant="outline">
              <a href={url} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                Preview dashboard
              </a>
            </Button>
          </>
        )}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        The link works only for this emergency and expires automatically once it ends.
      </p>
    </div>
  );
}
