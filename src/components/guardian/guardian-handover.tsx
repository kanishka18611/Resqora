import { Download, Printer, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/alerts";
import { exportHandoverPdf, handoverLines, handoverText } from "@/lib/guardian-handover";
import type { GuardianView } from "@/lib/guardian-view";

/** Printable handover card for hospital staff and responders. */
export function GuardianHandover({
  view,
  dashboardUrl,
}: {
  view: GuardianView;
  dashboardUrl: string;
}) {
  const rows = handoverLines(view, dashboardUrl);

  const share = async () => {
    const text = handoverText(view, dashboardUrl);
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `RESQORA handover ${view.reference}`, text });
        return;
      } catch {
        /* dismissed */
      }
    }
    await copyText(text);
    toast.success("Handover card copied");
  };

  return (
    <section className="glass-panel rounded-3xl p-4 print:shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold">Emergency handover card</h2>
        <span className="text-[11px] text-muted-foreground">Reference {view.reference}</span>
      </div>
      <dl className="mt-3 divide-y divide-border rounded-2xl bg-card/70">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-wrap gap-1 p-2.5 text-sm">
            <dt className="w-40 shrink-0 text-muted-foreground">{label}</dt>
            <dd className="min-w-0 flex-1 break-words font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex flex-wrap gap-2 print:hidden">
        <Button variant="hero" onClick={() => exportHandoverPdf(view, dashboardUrl)}>
          <Download className="size-4" />
          Download PDF
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="size-4" />
          Print
        </Button>
        <Button variant="outline" onClick={share}>
          <Share2 className="size-4" />
          Share
        </Button>
      </div>
    </section>
  );
}
