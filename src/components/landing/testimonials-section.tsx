import { motion } from "motion/react";
import { Quote } from "lucide-react";
import { SectionHeading } from "@/components/system/section-heading";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { testimonials } from "@/services/placeholder-content";

export function TestimonialsSection() {
  return (
    <section id="stories" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeading
        eyebrow="Stories"
        title="Trust, in their words"
        description="Placeholder testimonials — real accounts will replace this content."
        align="center"
      />
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {testimonials.map((item, index) => (
          <motion.figure
            key={item.id}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            className="glass-panel flex h-full flex-col rounded-2xl p-6"
          >
            <Quote className="size-6 text-primary/60" aria-hidden="true" />
            <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground">
              {item.quote}
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                  {item.initials}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {item.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{item.role}</span>
              </span>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}
