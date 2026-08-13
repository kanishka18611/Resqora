import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Loader2, Printer, QrCode, RefreshCw, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/system/page-header";
import { QrCode as QrCodeCard } from "@/components/resqora/qr-code";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { copyText } from "@/lib/alerts";
import { profileQuery } from "@/lib/api";
import { logSecurityEvent } from "@/lib/audit";
import { myResqrIdQuery, regenerateResqrId, resqrUrl } from "@/lib/resqr";

export const Route = createFileRoute("/_app/resqr-id")({
  head: () => ({
    meta: [
      { title: "My RESQR ID — RESQORA emergency QR" },
      {
        name: "description",
        content:
          "Your personal RESQR ID QR code. Download it, print a wallet card or share it so responders can pull up your emergency summary in one scan.",
      },
      { property: "og:title", content: "My RESQR ID — RESQORA" },
      {
        property: "og:description",
        content: "A secure emergency QR that carries no personal data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyResqrIdPage,
});

function MyResqrIdPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const resqr = useQuery(myResqrIdQuery(user?.id));
  const profile = useQuery(profileQuery(user?.id));
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  const code = resqr.data?.code ?? null;

  useEffect(() => {
    setUrl(code ? resqrUrl(code) : null);
  }, [code]);

  async function regenerate() {
    if (!user) return;
    setBusy(true);
    try {
      await regenerateResqrId(user.id, resqr.data?.id);
      await queryClient.invalidateQueries({ queryKey: ["resqr-id"] });
      void logSecurityEvent("RESQR ID regenerated", "Previous emergency QR invalidated");
      toast.success("New RESQR ID issued — the previous QR no longer works");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not regenerate");
    } finally {
      setBusy(false);
    }
  }

  async function printWalletCard() {
    if (!url) return;
    const qrcode = await import("qrcode");
    const dataUrl = await qrcode.toDataURL(url, { margin: 1, width: 420 });
    const name = profile.data?.full_name?.trim() || "RESQORA user";
    const blood = profile.data?.blood_group?.trim() || "Not Provided.";
    const win = window.open("", "_blank", "width=720,height=520");
    if (!win) {
      toast.error("Allow pop-ups to print your wallet card");
      return;
    }
    win.document.write(`<!doctype html><html><head><title>RESQR ID wallet card</title>
<style>
  body{font-family:system-ui,sans-serif;margin:0;padding:24px;display:flex;justify-content:center}
  .card{width:340px;border:2px solid #0f172a;border-radius:16px;padding:16px;display:flex;gap:14px;align-items:center}
  img{width:130px;height:130px}
  h1{font-size:15px;margin:0 0 6px}
  p{font-size:12px;margin:2px 0;color:#334155}
  strong{color:#0f172a}
</style></head><body onload="window.print()">
<div class="card">
  <img src="${dataUrl}" alt="RESQR ID QR code" />
  <div>
    <h1>RESQORA — RESQR ID</h1>
    <p><strong>${name}</strong></p>
    <p>Blood group: <strong>${blood}</strong></p>
    <p>Scan for the emergency summary.</p>
    <p>Ambulance 108 · Police 112</p>
  </div>
</div></body></html>`);
    win.document.close();
  }

  return (
    <>
      <PageHeader
        icon={QrCode}
        title="My RESQR ID"
        description="One scan shows responders your emergency summary. The QR stores only a secure code — never your personal data."
        actions={
          <Button asChild variant="outline">
            <Link to="/scan">
              <ScanLine className="size-4" />
              Scan a RESQR ID
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <QrCodeCard
          value={url}
          label="Your emergency QR"
          filename="resqora-resqr-id.png"
          size={240}
        />

        <div className="glass-panel space-y-4 rounded-3xl p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              RESQR ID
            </p>
            <p className="mt-1 break-all font-mono text-sm text-foreground">
              {resqr.isPending ? "Issuing…" : (code ?? "—")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (!url) return;
                void copyText(url).then(() => toast.success("RESQR ID link copied"));
              }}
              disabled={!url}
            >
              <Copy className="size-4" />
              Copy link
            </Button>
            <Button variant="outline" onClick={printWalletCard} disabled={!url}>
              <Printer className="size-4" />
              Print wallet card
            </Button>
            <Button variant="destructive" onClick={regenerate} disabled={busy || !user}>
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Regenerate QR
            </Button>
          </div>

          <p className="rounded-2xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
            Regenerating immediately invalidates the previous QR, so reprint any wallet cards or
            stickers you have shared.
          </p>

          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Shows name, blood group, age, allergies, medicines and conditions.</li>
            <li>• Shows your guardian, preferred hospital and preferred language.</li>
            <li>• Never shows email, address, account or payment information.</li>
          </ul>
        </div>
      </div>
    </>
  );
}
