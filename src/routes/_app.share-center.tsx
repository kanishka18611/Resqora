import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, Link2, Mail, MapPin, Send, Share2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/system/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode } from "@/components/resqora/qr-code";
import { QuickCallPanel } from "@/components/resqora/quick-call-panel";
import { EmptyState } from "@/components/system/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { useLivePosition } from "@/hooks/use-live-position";
import { useNearbyServices } from "@/hooks/use-nearby-services";
import { activeEmergencyQuery, contactsQuery, profileQuery } from "@/lib/api";
import { copyText, coordsOf, mapsLink } from "@/lib/alerts";
import { deliveriesQuery } from "@/lib/alert-delivery";
import { GuardianSessionPanel } from "@/components/resqora/guardian-session-panel";
import { WhatsappShareStatus } from "@/components/resqora/whatsapp-share-status";
import { supabase } from "@/integrations/supabase/client";
import {
  buildEmergencyEmail,
  contactsWithEmail,
  sendEmergencyEmailAlerts,
} from "@/lib/email-alerts";
import { logActivity } from "@/lib/activity";
import { recentSharesQuery } from "@/lib/shares";
import { buildWhatsappAlert } from "@/lib/whatsapp-alerts";
import { emailHref, ensureLiveShareLink, ensureMedicalShareLink, shareUrl } from "@/lib/share";
import { ensureTrackingUrl } from "@/lib/guardian";

export const Route = createFileRoute("/_app/share-center")({
  head: () => ({
    meta: [
      { title: "Emergency share centre — RESQORA" },
      {
        name: "description",
        content:
          "Send emergency emails, share on WhatsApp, copy the secure live tracking link and hand out QR codes for your medical ID — all from one screen.",
      },
      { property: "og:title", content: "Emergency share centre — RESQORA" },
      {
        property: "og:description",
        content: "Email alerts, WhatsApp share, tracking link and QR codes in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ShareCenterPage,
});

function ShareCenterPage() {
  const { user } = useAuth();
  const profile = useQuery(profileQuery(user?.id));
  const contacts = useQuery(contactsQuery(user?.id));
  const active = useQuery(activeEmergencyQuery(user?.id));
  const deliveries = useQuery(deliveriesQuery(active.data?.id));
  const shares = useQuery(recentSharesQuery(user?.id));
  const { position, address } = useLivePosition();
  const nearby = useNearbyServices(position);
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null);
  const [medicalUrl, setMedicalUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const emergency = active.data ?? null;
  const contactList = contacts.data ?? [];
  const emailable = contactsWithEmail(contactList);
  const coords = emergency
    ? coordsOf(emergency)
    : position
      ? { lat: position.lat, lng: position.lng }
      : null;

  useEffect(() => {
    if (!user || !emergency) return;
    // The shared live-tracking link is always the secure Guardian dashboard.
    void ensureTrackingUrl({ userId: user.id, emergencyId: emergency.id })
      .then((tracking) => setTrackingUrl(tracking.url))
      .catch(() =>
        ensureLiveShareLink(user.id, emergency.id)
          .then((link) => setTrackingUrl(shareUrl(link)))
          .catch(() => setTrackingUrl(null)),
      );
  }, [user?.id, emergency?.id, user, emergency]);

  useEffect(() => {
    if (!user) return;
    void ensureMedicalShareLink(user.id)
      .then((link) => setMedicalUrl(shareUrl(link)))
      .catch(() => setMedicalUrl(null));
  }, [user?.id, user]);

  const message = emergency
    ? buildWhatsappAlert({ emergency, profile: profile.data, address, trackingUrl })
    : null;
  const emailPreview = emergency
    ? buildEmergencyEmail({
        emergency,
        profile: profile.data,
        trackingUrl,
      })
    : null;
  const emailDeliveries = (deliveries.data ?? []).filter((d) => d.channel === "email");
  const shareMedical = profile.data?.share_medical_in_alerts !== false;

  async function toggleMedicalSharing() {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ share_medical_in_alerts: !shareMedical })
      .eq("id", user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await profile.refetch();
    toast.success(
      shareMedical
        ? "Medical details will no longer be included in emergency emails"
        : "Medical details will be included in emergency emails",
    );
  }

  async function copy(value: string, label: string) {
    await copyText(value);
    toast.success(`${label} copied`);
  }

  async function nativeShare() {
    if (!message) return;
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
    const payload = {
      title: "RESQORA emergency alert",
      text: message,
      url: trackingUrl ?? undefined,
    };
    if (nav.share) {
      try {
        await nav.share(payload);
        await logActivity(user?.id, "Emergency shared", "Shared through the device share sheet");
        await shares.refetch();
      } catch {
        /* the user dismissed the sheet */
      }
      return;
    }
    await copy(message, "Emergency message");
  }

  async function sendEmails() {
    if (!user || !emergency) return;
    setSending(true);
    try {
      const result = await sendEmergencyEmailAlerts({
        userId: user.id,
        emergency,
        profile: profile.data,
        contacts: contactList,
        trackingUrl,
      });
      if (result.skipped) {
        toast.error("Add an email address to your trusted contacts first");
      } else if (!result.configured) {
        toast.error("Email service is not configured.");
      } else if (result.failed > 0) {
        toast.error(
          `✗ Email sending failed for ${result.failed} contact(s): ${result.results
            .filter((r) => !r.ok)
            .map((r) => `${r.name} — ${r.error}`)
            .join("; ")}`,
        );
      } else {
        toast.success(`✓ Email sent successfully to ${result.sent} contact(s)`);
        await logActivity(user.id, "Emergency emails sent", `${result.sent} contact(s)`);
      }
      await deliveries.refetch();
      await shares.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send the emails");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <PageHeader
        icon={Share2}
        title="Emergency share centre"
        description="Everything your contacts need — emergency email, WhatsApp share, secure tracking link and QR codes — in one place."
      />

      {!emergency ? (
        <EmptyState
          icon={ShieldAlert}
          title="No emergency is active"
          description="Trigger an SOS to unlock live sharing. Your medical ID QR code below always works."
          action={
            <Button asChild variant="hero">
              <Link to="/emergency">Open emergency SOS</Link>
            </Button>
          }
        />
      ) : (
        <section className="space-y-4">
          <GuardianSessionPanel
            emergency={emergency}
            profile={profile.data}
            contacts={contactList}
            trackingUrl={trackingUrl}
          />
          <div className="rounded-2xl border border-border bg-card/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Mail className="size-4 text-primary" aria-hidden="true" />
                Emergency email alerts
              </h2>
              <Badge variant="outline" className="rounded-full text-[10px]">
                {emailable.length} of {contactList.length} contacts have an email
              </Badge>
            </div>
            <ul className="mt-3 space-y-2">
              {emailDeliveries.length === 0 ? (
                <li className="text-xs text-muted-foreground">
                  No emails sent for this emergency yet.
                </li>
              ) : (
                emailDeliveries.map((delivery) => (
                  <li
                    key={delivery.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-muted/60 px-3 py-2 text-xs"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">
                        {delivery.contact_name}
                      </span>
                      <span className="block truncate text-muted-foreground">
                        {delivery.contact_email}
                      </span>
                    </span>
                    <span
                      className={
                        delivery.status === "delivered"
                          ? "shrink-0 font-semibold text-success"
                          : delivery.status === "failed"
                            ? "shrink-0 font-semibold text-alert"
                            : "shrink-0 font-semibold text-muted-foreground"
                      }
                    >
                      {delivery.status === "delivered"
                        ? "✓ Email sent"
                        : delivery.status === "failed"
                          ? "❌ Delivery failed"
                          : "Sending…"}
                    </span>
                  </li>
                ))
              )}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="hero" onClick={sendEmails} disabled={sending}>
                <Send className="size-4" />
                {emailDeliveries.length > 0 ? "Send again" : "Send emergency emails"}
              </Button>
              {emailPreview && (
                <Button asChild variant="outline">
                  <a href={emailHref(emailPreview.message, emailPreview.subject)}>
                    <Mail className="size-4" />
                    Open mail app
                  </a>
                </Button>
              )}
              <Button variant="ghost" onClick={toggleMedicalSharing}>
                {shareMedical ? "Stop sharing medical info" : "Include medical info"}
              </Button>
            </div>
            {emailPreview && (
              <details className="mt-3 rounded-xl border border-border p-3">
                <summary className="cursor-pointer text-xs font-medium text-primary">
                  Preview the emergency email
                </summary>
                <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap text-xs text-foreground">
                  {emailPreview.message}
                </pre>
              </details>
            )}
          </div>

          <WhatsappShareStatus
            emergency={emergency}
            profile={profile.data}
            contacts={contactList}
            trackingUrl={trackingUrl}
            address={address}
          />

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="hero"
              disabled={!message}
              onClick={() => message && copy(message, "Emergency message")}
            >
              <Copy className="size-4" />
              Copy emergency message
            </Button>
            <Button
              variant="outline"
              disabled={!trackingUrl}
              onClick={() => trackingUrl && copy(trackingUrl, "Live tracking link")}
            >
              <Link2 className="size-4" />
              Copy live tracking link
            </Button>
            <Button variant="outline" onClick={nativeShare}>
              <Share2 className="size-4" />
              Share anywhere
            </Button>
            <Button
              variant="outline"
              disabled={!coords}
              onClick={() => coords && copy(mapsLink(coords), "Location")}
            >
              <MapPin className="size-4" />
              Copy Google Maps link
            </Button>
          </div>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <QrCode
          value={trackingUrl}
          label="Live emergency tracking"
          filename="resqora-live-tracking.png"
        />
        <QrCode value={medicalUrl} label="Medical ID & profile" filename="resqora-medical-id.png" />
      </section>

      <QuickCallPanel contacts={contactList} nearby={nearby.data} />

      <section className="rounded-2xl border border-border bg-card/60 p-4">
        <h2 className="text-sm font-semibold text-foreground">Recent shares</h2>
        {(shares.data ?? []).length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Nothing shared yet — every share is logged here for your records.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {(shares.data ?? []).map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate text-foreground">
                  {entry.action}
                  {entry.detail ? ` — ${entry.detail}` : ""}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {new Date(entry.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
