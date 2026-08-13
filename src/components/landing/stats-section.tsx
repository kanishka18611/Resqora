import { motion } from "motion/react";
import { StatCard } from "@/components/system/stat-card";
import { SectionHeading } from "@/components/system/section-heading";
import { statPlaceholders } from "@/services/placeholder-content";

export function StatsSection() {
  return (
    <section id="impact" className="border-y border-border/60 bg-card/40 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Impact"
          title="Numbers that will tell the story"
          description="Placeholder statistics reserved for live platform metrics."
          align="center"
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statPlaceholders.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
            >
              <StatCard icon={stat.icon} label={stat.label} value={stat.value} delta={stat.delta} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
