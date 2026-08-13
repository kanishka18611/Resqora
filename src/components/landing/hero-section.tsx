import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, BrainCircuit, MapPin, Siren, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusIndicator } from "@/components/system/status-indicator";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden aurora">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-28 lg:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="min-w-0"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground backdrop-blur-md">
            <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
            Every Second Matters. Every Life Connected.
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
            <span className="text-gradient">Emergency Assistance in Seconds</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            RESQORA is an AI-powered emergency intelligence platform designed to help you reach the
            right assistance in moments that matter — and to keep the people who love you informed
            every step of the way.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="hero" size="xl">
              <Link to="/emergency">
                <Siren className="size-5" />
                Start emergency demo
              </Link>
            </Button>
            <Button asChild variant="glass" size="xl">
              <Link to="/dashboard">
                Explore dashboard
                <ArrowRight className="size-5" />
              </Link>
            </Button>
          </div>
          <dl className="mt-10 grid max-w-lg grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              { label: "Response window", value: "Seconds" },
              { label: "Trusted circle", value: "Always synced" },
              { label: "Coverage", value: "Wherever you go" },
            ].map((item) => (
              <div key={item.label} className="min-w-0">
                <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {item.label}
                </dt>
                <dd className="mt-1 truncate font-display text-sm font-semibold text-foreground">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="relative"
          aria-hidden="true"
        >
          <div className="glass-panel rounded-3xl p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-alert/12 text-alert pulse-ring">
                  <Siren className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">Live incident</p>
                  <p className="truncate text-xs text-muted-foreground">Placeholder preview</p>
                </div>
              </div>
              <StatusIndicator status="active" label="Dispatching" pulse />
            </div>

            <div className="mt-6 space-y-3">
              {[
                { icon: BrainCircuit, title: "AI triage complete", meta: "Priority assessed" },
                { icon: MapPin, title: "Nearest responder located", meta: "Route optimised" },
                { icon: Sparkles, title: "Circle notified", meta: "3 contacts updated" },
              ].map((row) => (
                <div
                  key={row.title}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 p-3.5"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <row.icon className="size-4.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{row.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{row.meta}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-linear-to-r from-primary/12 to-alert/12 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Estimated arrival
              </p>
              <p className="mt-1 font-display text-2xl font-semibold text-foreground">— min</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
