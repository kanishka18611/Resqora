import { Siren } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function SosButton({
  onTrigger,
  disabled,
  active,
}: {
  onTrigger: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <div className="relative grid place-items-center py-4">
      {!disabled && (
        <span className="pointer-events-none absolute size-44 animate-ping rounded-full bg-alert/20 sm:size-52" />
      )}
      <motion.button
        type="button"
        whileTap={{ scale: 0.94 }}
        onClick={onTrigger}
        disabled={disabled}
        aria-label={active ? "Emergency already active" : "Trigger emergency SOS"}
        className={cn(
          "relative grid size-40 place-items-center rounded-full bg-linear-to-br from-alert to-alert/80 text-alert-foreground shadow-2xl shadow-alert/40 transition-all sm:size-48",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-alert/40",
          disabled && "cursor-not-allowed opacity-60 shadow-none",
        )}
      >
        <span className="flex flex-col items-center gap-1">
          <Siren className="size-10 sm:size-12" aria-hidden="true" />
          <span className="font-display text-2xl font-bold tracking-wide">SOS</span>
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] opacity-90">
            {active ? "Active" : "Tap to alert"}
          </span>
        </span>
      </motion.button>
    </div>
  );
}
