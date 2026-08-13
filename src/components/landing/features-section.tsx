import { motion } from "motion/react";
import { SectionHeading } from "@/components/system/section-heading";
import { featurePreviews } from "@/services/placeholder-content";
import { cn } from "@/lib/utils";

const toneClasses = {
  info: "bg-info/10 text-info",
  alert: "bg-alert/10 text-alert",
  success: "bg-success/10 text-success",
} as const;

export function FeaturesSection() {
  return (
    <section id="platform" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeading
        eyebrow="Platform preview"
        title="Built for the seconds that decide everything"
        description="Placeholder feature previews outlining the RESQORA experience. Functionality is not wired up yet."
        align="center"
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {featurePreviews.map((feature, index) => (
          <motion.article
            key={feature.id}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
            className="glass-panel rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1"
          >
            <span
              className={cn(
                "grid size-11 place-items-center rounded-2xl",
                toneClasses[feature.tone],
              )}
            >
              <feature.icon className="size-5" aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-base font-semibold text-foreground">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
