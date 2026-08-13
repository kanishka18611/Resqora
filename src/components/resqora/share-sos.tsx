import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Copy,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  RefreshCcw,
  ShieldOff,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { copyText, coordsOf, mapsLink } from "@/lib/alerts";
import type { Emergency, EmergencyContact, Profile } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { logSecurityEvent } from "@/lib/audit";
import {
  buildSosMessage,
  emailHref,
  ensureLiveShareLink,
  revokeShareLink,
  rotateShareLink,
  shareUrl,
  smsHref,
  whatsappHref,
  type ShareLink,
} from "@/lib/share";

/**
 * Share SOS panel: generates a secure public tracking link for the active
 * emergency and hands the composed message to WhatsApp, SMS or email.
 */
export function ShareSos({
  emergency,
  profile,
  contacts,
}: {
  emergency: Emergency;
  profile: Profile | null | undefined;
  contacts: EmergencyContact[];
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const coords = coordsOf(emergency);

  const link = useQuery({
    queryKey: ["live-share-link", emergency.id],
    enabled: Boolean(user?.id),
    queryFn: async () => ensureLiveShareLink(user!.id, emergency.id),
  });

  const active = link.data && link.data.active ? (link.data as ShareLink) : null;
  const url = active ? shareUrl(active) : null;
  const message = buildSosMessage({ emergency, profile, link: url });
  const primaryPhone = contacts[0]?.phone;

  async function copy(value: string, label: string) {
    await copyText(value);
    toast.success(`${label} copied`);
  }

  async function stopSharing() {
    if (!active) return;
    setBusy(true);
    try {
      await revokeShareLink(active.id);
      await logActivity(
        user?.id,
        "Location sharing stopped",
        `Emergency ${emergency.id.slice(0, 8)}`,
      );
      void logSecurityEvent("Share link revoked", `Emergency ${emergency.id.slice(0, 8)}`);
      toast.success("Sharing link disabled");
      await link.refetch();
    } finally {
      setBusy(false);
    }
  }

  async function rotate() {
    if (!active) return;
    setBusy(true);
    try {
      await rotateShareLink(active);
      void logSecurityEvent("Share link rotated", `Emergency ${emergency.id.slice(0, 8)}`);
      toast.success("A new link was generated — the old one no longer works");
      await link.refetch();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">Secure tracking link</p>
          <Badge variant={active ? "secondary" : "outline"} className="rounded-full text-[10px]">
            {active ? "Sharing live" : "Sharing stopped"}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Anyone with this link can follow your live location on a map until you stop sharing.
        </p>
        <p className="mt-3 truncate rounded-xl bg-muted px-3 py-2 font-mono text-xs text-foreground">
          {url ?? "Link disabled"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={!url}
            onClick={() => url && copy(url, "Emergency link")}
          >
            <Link2 className="size-4" />
            Copy emergency link
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!coords}
            onClick={() => coords && copy(mapsLink(coords), "Google Maps link")}
          >
            <MapPin className="size-4" />
            Copy Maps link
          </Button>
          {active ? (
            <>
              <Button size="sm" variant="outline" onClick={rotate} disabled={busy}>
                <RefreshCcw className="size-4" />
                New link
              </Button>
              <Button size="sm" variant="outline" onClick={stopSharing} disabled={busy}>
                <ShieldOff className="size-4" />
                Stop sharing
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="hero"
              disabled={busy || !user}
              onClick={async () => {
                setBusy(true);
                try {
                  await ensureLiveShareLink(user!.id, emergency.id);
                  await link.refetch();
                  await logActivity(user?.id, "Location shared", "Live tracking link generated");
                  toast.success("Live tracking link created");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Link2 className="size-4" />
              Start sharing again
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Button asChild variant="hero">
          <a href={whatsappHref(message, primaryPhone)} target="_blank" rel="noreferrer">
            <MessageCircle className="size-4" />
            WhatsApp
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={smsHref(message, primaryPhone)}>
            <MessageSquare className="size-4" />
            SMS
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={emailHref(message)}>
            <Mail className="size-4" />
            Email
          </a>
        </Button>
      </div>

      <details className="rounded-2xl border border-border bg-card/60 p-4">
        <summary className="cursor-pointer text-xs font-medium text-primary">
          Preview the message
        </summary>
        <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-foreground">
          {message}
        </pre>
        <Button
          size="sm"
          variant="outline"
          className="mt-3"
          onClick={() => copy(message, "Message")}
        >
          <Copy className="size-4" />
          Copy message
        </Button>
      </details>
    </div>
  );
}
