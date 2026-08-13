import { motion } from "motion/react";

const BARS = [0.4, 0.75, 1, 0.6, 0.9, 0.5, 0.8];

/** Live waveform shown while RESQ AI is listening to the microphone. */
export function VoiceWave({ label = "Listening…" }: { label?: string }) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3"
      role="status"
      aria-live="polite"
    >
      <div className="flex h-6 items-end gap-1" aria-hidden="true">
        {BARS.map((peak, index) => (
          <motion.span
            key={index}
            className="w-1.5 rounded-full bg-primary"
            initial={{ height: 6 }}
            animate={{ height: [6, 24 * peak, 6] }}
            transition={{
              duration: 0.7 + index * 0.08,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.06,
            }}
          />
        ))}
      </div>
      <p className="text-sm font-medium text-primary">{label}</p>
    </div>
  );
}
