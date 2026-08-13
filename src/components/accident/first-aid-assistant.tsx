import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, CheckCircle2, HeartPulse, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Guided first aid — one step at a time, large targets, minimal reading. */
export function FirstAidAssistant({
  title,
  steps,
  onComplete,
}: {
  title: string;
  steps: string[];
  onComplete?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState<number[]>([]);

  useEffect(() => {
    setIndex(0);
    setDone([]);
  }, [steps]);

  const step = steps[index] ?? "";
  const last = index === steps.length - 1;

  function next() {
    setDone((prev) => (prev.includes(index) ? prev : [...prev, index]));
    if (last) {
      onComplete?.();
      return;
    }
    setIndex((value) => Math.min(steps.length - 1, value + 1));
  }

  return (
    <section aria-label="Smart first aid assistant" className="glass-panel rounded-3xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <HeartPulse className="size-4 text-alert" aria-hidden="true" />
          First aid — {title}
        </h2>
        <span className="text-xs font-semibold text-muted-foreground">
          Step {index + 1} of {steps.length}
        </span>
      </div>

      <div className="mt-3 flex gap-1.5" aria-hidden="true">
        {steps.map((item, i) => (
          <span
            key={item}
            className={
              i <= index || done.includes(i)
                ? "h-1.5 flex-1 rounded-full bg-alert"
                : "h-1.5 flex-1 rounded-full bg-muted"
            }
          />
        ))}
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        className="mt-4 flex items-start gap-3 rounded-2xl border border-alert/40 bg-alert/5 p-4"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-alert/15 text-alert">
          {done.includes(index) ? (
            <CheckCircle2 className="size-5" aria-hidden="true" />
          ) : (
            <Stethoscope className="size-5" aria-hidden="true" />
          )}
        </span>
        <p aria-live="polite" className="text-lg font-semibold leading-snug text-foreground">
          {step}
        </p>
      </motion.div>

      <div className="mt-4 flex gap-3">
        <Button
          variant="outline"
          className="h-14 flex-1 rounded-2xl text-base"
          disabled={index === 0}
          onClick={() => setIndex((value) => Math.max(0, value - 1))}
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
          Back
        </Button>
        <Button
          className="h-14 flex-[2] rounded-2xl bg-alert text-base font-bold text-alert-foreground hover:bg-alert/90"
          onClick={next}
        >
          {last ? "Done" : "Next step"}
          {!last && <ArrowRight className="size-5" aria-hidden="true" />}
        </Button>
      </div>
    </section>
  );
}
