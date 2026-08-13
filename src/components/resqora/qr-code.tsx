import { useEffect, useState } from "react";
import { Download, QrCode as QrIcon, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Reusable offline QR renderer (qrcode runs fully in the browser — no API). */
export function QrCode({
  value,
  label,
  filename = "resqora-qr.png",
  size = 220,
}: {
  value: string | null;
  label: string;
  filename?: string;
  size?: number;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setDataUrl(null);
      return;
    }
    let alive = true;
    void import("qrcode").then(async (qrcode) => {
      const url = await qrcode.toDataURL(value, { margin: 1, width: size });
      if (alive) setDataUrl(url);
    });
    return () => {
      alive = false;
    };
  }, [value, size]);

  async function share() {
    if (!dataUrl) return;
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], filename, { type: "image/png" });
      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
        share?: (data: ShareData) => Promise<void>;
      };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ title: label, files: [file] });
        return;
      }
      if (nav.share && value) {
        await nav.share({ title: label, text: value });
        return;
      }
      await navigator.clipboard.writeText(value ?? "");
      toast.success("Link copied — sharing is not supported on this device");
    } catch {
      /* user dismissed the share sheet */
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <QrIcon className="size-4 text-primary" aria-hidden="true" />
        {label}
      </p>
      <div className="mt-3 grid place-items-center rounded-2xl bg-white p-3">
        {dataUrl ? (
          <img src={dataUrl} alt={`${label} QR code`} width={size} height={size} />
        ) : (
          <div
            className="animate-pulse rounded-xl bg-muted"
            style={{ width: size, height: size }}
            aria-hidden="true"
          />
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline" disabled={!dataUrl}>
          <a href={dataUrl ?? "#"} download={filename}>
            <Download className="size-4" />
            Download
          </a>
        </Button>
        <Button size="sm" variant="outline" onClick={share} disabled={!dataUrl}>
          <Share2 className="size-4" />
          Share
        </Button>
      </div>
    </div>
  );
}
