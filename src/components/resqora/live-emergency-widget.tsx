import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ChevronDown, ChevronUp, Crosshair, MapPin, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLivePosition } from "@/hooks/use-live-position";
import { activeEmergencyQuery } from "@/lib/api";
import { formatDuration } from "@/lib/emergency";

/** Floating live-emergency widget shown on every page while an SOS is active. */
export function LiveEmergencyWidget() {
  const { user } = useAuth();
  const active = useQuery(activeEmergencyQuery(user?.id));
  const { position, address } = useLivePosition();
  const [open, setOpen] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  const emergency = active.data ?? null;

  useEffect(() => {
    if (!emergency) return;
    const tick = () =>
      setElapsed(
        Math.max(1, Math.round((Date.now() - new Date(emergency.started_at).getTime()) / 1000)),
      );
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [emergency?.started_at, emergency]);

  if (!emergency) return null;

  const displayAddress = address || emergency.address || "Locating…";

  return (
    <>
      <motion.aside
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        aria-label="Active emergency"
        className="fixed inset-x-3 bottom-40 z-50 mx-auto max-w-sm rounded-2xl border border-alert/40 bg-card/95 p-4 shadow-2xl shadow-alert/20 backdrop-blur lg:inset-x-auto lg:bottom-32 lg:right-8"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-alert">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-alert/60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-alert" />
            </span>
            Emergency active
          </p>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Collapse emergency widget" : "Expand emergency widget"}
            className="text-muted-foreground transition hover:text-foreground"
          >
            {open ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </button>
        </div>

        <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">
          {formatDuration(elapsed)}
        </p>

        {open && (
          <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
            <p className="flex items-start gap-1.5">
              <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span className="line-clamp-2">{displayAddress}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Crosshair className="size-3.5 shrink-0" aria-hidden="true" />
              {position ? `±${Math.round(position.accuracy)} m accuracy` : "Waiting for GPS fix"}
            </p>
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link to="/live">
              <Radar className="size-4" />
              Live tracking
            </Link>
          </Button>
        </div>
      </motion.aside>
    </>
  );
}
