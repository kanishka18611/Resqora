import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, MailCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/system/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { profileQuery } from "@/lib/api";
import {
  emailConfigParts,
  initEmailService,
  isEmailConfigured,
  isEmailInitialised,
  missingEmailConfig,
  readEmailDiagnostics,
  sendEmergencyTemplateEmail,
  type EmailDiagnostics,
} from "@/lib/email-service";

export const Route = createFileRoute("/_app/email-diagnostics")({
  head: () => ({
    meta: [
      { title: "Email diagnostics — RESQORA" },
      {
        name: "description",
        content:
          "Verify the RESQORA emergency email transport: EmailJS connection, service and template IDs, last delivery and last error.",
      },
      { property: "og:title", content: "RESQORA email diagnostics" },
      {
        property: "og:description",
        content:
          "Live status of the emergency email transport used for contact and Guardian alerts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EmailDiagnosticsPage,
});

function mask(value: string) {
  if (!value) return "Not set";
  return value.length <= 6 ? value : `${value.slice(0, 4)}…${value.slice(-3)}`;
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/50 py-3 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 text-right text-sm font-medium">
        {ok === undefined ? null : ok ? (
          <CheckCircle2 className="size-4 text-emerald-500" />
        ) : (
          <XCircle className="size-4 text-destructive" />
        )}
        {value}
      </span>
    </div>
  );
}

function EmailDiagnosticsPage() {
  const { user } = useAuth();
  const { data: profile } = useQuery(profileQuery(user?.id));
  const [diag, setDiag] = useState<EmailDiagnostics>({});
  const [sending, setSending] = useState(false);
  const parts = emailConfigParts();
  const configured = isEmailConfigured();
  const missing = missingEmailConfig();

  useEffect(() => {
    initEmailService();
    setDiag(readEmailDiagnostics());
  }, []);

  async function sendTest() {
    const to = profile?.email || user?.email;
    if (!to) {
      toast.error("Add an email address to your profile first");
      return;
    }
    setSending(true);
    const result = await sendEmergencyTemplateEmail({
      to_email: to,
      user_name: profile?.full_name || "RESQORA user",
      time: new Date().toLocaleString(),
      address: "Diagnostics test — no live emergency",
      map_link: "https://maps.google.com",
      tracking_link: `${window.location.origin}/share-center`,
      emergency_id: "TEST",
      reply_to: to,
    });
    setDiag(readEmailDiagnostics());
    setSending(false);
    if (result.ok) toast.success("✓ Email sent successfully");
    else toast.error(`✗ Email sending failed — ${result.error}`);
  }

  return (
    <>
      <PageHeader
        icon={MailCheck}
        title="Email diagnostics"
        description="Live status of the EmailJS transport that delivers emergency alerts to your trusted contacts and Guardian."
      />

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">EmailJS connection</CardTitle>
          <Badge variant={configured ? "default" : "destructive"}>
            {configured ? "✓ EmailJS Connected" : "Not configured"}
          </Badge>
        </CardHeader>
        <CardContent>
          {!configured ? (
            <p className="mb-3 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
              Email service is not configured. Missing: {missing.join(", ")}
            </p>
          ) : null}
          <Row
            label="SDK initialised"
            value={isEmailInitialised() ? "Yes" : "No"}
            ok={isEmailInitialised()}
          />
          <Row label="Service ID" value={mask(parts.serviceId)} ok={Boolean(parts.serviceId)} />
          <Row label="Template ID" value={mask(parts.templateId)} ok={Boolean(parts.templateId)} />
          <Row
            label="Public key loaded"
            value={parts.publicKey ? "Yes" : "No"}
            ok={Boolean(parts.publicKey)}
          />
          <Row
            label="Last email sent"
            value={
              diag.lastSentAt
                ? `${new Date(diag.lastSentAt).toLocaleString()}${diag.lastRecipient ? ` → ${diag.lastRecipient}` : ""}`
                : "No email sent yet"
            }
          />
          <Row
            label="Last error"
            value={
              diag.lastError
                ? `${diag.lastError}${diag.lastErrorAt ? ` (${new Date(diag.lastErrorAt).toLocaleString()})` : ""}`
                : "None"
            }
            ok={!diag.lastError}
          />
          <Button className="mt-4" onClick={sendTest} disabled={sending || !configured}>
            {sending ? "Sending…" : "Send test email to myself"}
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
