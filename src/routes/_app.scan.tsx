import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CameraOff, Loader2, ScanLine } from "lucide-react";
import { PageHeader } from "@/components/system/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseResqrCode } from "@/lib/resqr";

export const Route = createFileRoute("/_app/scan")({
  head: () => ({
    meta: [
      { title: "Scan a RESQR ID — RESQORA QR scanner" },
      {
        name: "description",
        content:
          "Point your camera at a RESQORA RESQR ID to open the emergency summary with blood group, allergies, medications and guardian contact.",
      },
      { property: "og:title", content: "RESQR ID scanner — RESQORA" },
      {
        property: "og:description",
        content: "Scan an emergency QR and open the care summary instantly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ScanPage,
});

function ScanPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const [status, setStatus] = useState<"idle" | "starting" | "scanning" | "denied">("idle");
  const [manual, setManual] = useState("");
  const [error, setError] = useState<string | null>(null);

  const open = useCallback(
    (code: string) => {
      void navigate({ to: "/r/$code", params: { code } });
    },
    [navigate],
  );

  const stop = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  async function start() {
    setError(null);
    setStatus("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setStatus("scanning");
      const jsQR = (await import("jsqr")).default;
      const tick = () => {
        const canvas = canvasRef.current;
        if (!canvas || !video.videoWidth) {
          frameRef.current = requestAnimationFrame(tick);
          return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(image.data, image.width, image.height);
        const code = result?.data ? parseResqrCode(result.data) : null;
        if (code) {
          stop();
          open(code);
          return;
        }
        frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
    } catch {
      setStatus("denied");
      setError("Camera access was blocked. Enter the RESQR ID manually below.");
    }
  }

  return (
    <>
      <PageHeader
        icon={ScanLine}
        title="Scan a RESQR ID"
        description="Point the camera at a RESQORA emergency QR — the care summary opens immediately."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-panel rounded-3xl p-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-black">
            <video
              ref={videoRef}
              className="size-full object-cover"
              muted
              playsInline
              aria-label="RESQR ID camera preview"
            />
            <canvas ref={canvasRef} className="hidden" />
            {status !== "scanning" && (
              <div className="absolute inset-0 grid place-items-center bg-black/70 p-6 text-center">
                {status === "denied" ? (
                  <CameraOff className="size-10 text-white/70" aria-hidden="true" />
                ) : status === "starting" ? (
                  <Loader2 className="size-10 animate-spin text-white/70" aria-hidden="true" />
                ) : (
                  <ScanLine className="size-10 text-white/70" aria-hidden="true" />
                )}
              </div>
            )}
          </div>
          <Button
            className="mt-4 h-14 w-full rounded-2xl text-base"
            onClick={start}
            disabled={status === "starting" || status === "scanning"}
          >
            {status === "scanning" ? "Scanning…" : "Start camera"}
          </Button>
        </div>

        <div className="glass-panel space-y-4 rounded-3xl p-5">
          <div>
            <p className="text-sm font-semibold text-foreground">Enter a RESQR ID manually</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Useful when a QR is damaged or the camera is unavailable.
            </p>
          </div>
          <Input
            value={manual}
            onChange={(event) => setManual(event.target.value)}
            placeholder="RQ…"
            aria-label="RESQR ID code"
          />
          <Button
            variant="hero"
            className="w-full"
            onClick={() => {
              const code = parseResqrCode(manual);
              if (!code) {
                setError("That does not look like a RESQR ID.");
                return;
              }
              setError(null);
              open(code);
            }}
            disabled={!manual.trim()}
          >
            Open emergency summary
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </>
  );
}
