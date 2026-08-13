import { Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <div className="glass-panel aurora overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-linear-to-br from-primary to-alert text-primary-foreground">
          <ShieldCheck className="size-6" aria-hidden="true" />
        </span>
        <h2 className="mx-auto mt-6 max-w-2xl text-2xl font-semibold text-foreground sm:text-4xl">
          Preparedness should feel effortless
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
          Explore the RESQORA interface foundation — a calm, fast, accessible surface ready for
          emergency intelligence.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="hero" size="lg">
            <Link to="/dashboard">
              Open the dashboard
              <ArrowRight className="size-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
