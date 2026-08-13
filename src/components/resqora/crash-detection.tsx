import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CarFront, Loader2, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const COUNTDOWN = 10;

export function CrashDetectionPanel({
  enabled,
  onToggle,
  onConfirm,
  busy,
}: {
  enabled: boolean;
  onToggle: (value: boolean) => void;
  onConfirm: () => Promise<void> | void;
  busy?: boolean;
}) {
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      void onConfirm();
      return;
    }
    const timer = window.setTimeout(() => setCountdown((value) => (value ?? 1) - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown, onConfirm]);

  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-info/10 text-info">
            <CarFront className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Automatic crash detection</h3>
            <p className="text-sm text-muted-foreground">
              Sensors watch for sudden impact and auto-escalate if you don't respond.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="crash-toggle" className="text-xs text-muted-foreground">
            {enabled ? "On" : "Off"}
          </Label>
          <Switch id="crash-toggle" checked={enabled} onCheckedChange={onToggle} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {countdown === null ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Button
              variant="outline"
              className="mt-5 w-full"
              disabled={!enabled}
              onClick={() => setCountdown(COUNTDOWN)}
            >
              Simulate crash impact
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="counting"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-5 rounded-2xl border border-alert/40 bg-alert/5 p-4"
            role="alert"
          >
            <p className="text-sm font-semibold text-alert">
              Severe impact detected — sending SOS in {countdown}s
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cancel now if you're OK. Otherwise we alert your contacts automatically.
            </p>
            <Progress value={(countdown / COUNTDOWN) * 100} className="mt-3 h-2" />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setCountdown(null)} disabled={busy}>
                <ShieldOff className="size-4" />
                I'm OK — cancel
              </Button>
              <Button
                variant="emergency"
                onClick={() => {
                  setCountdown(null);
                  void onConfirm();
                }}
                disabled={busy}
              >
                {busy && <Loader2 className="size-4 animate-spin" />}
                Send now
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
