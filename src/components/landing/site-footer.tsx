import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/logo";

const columns = [
  { title: "Platform", links: ["Dashboard", "Emergency", "Nearby", "History"] },
  { title: "Company", links: ["About", "Careers", "Press", "Contact"] },
  { title: "Resources", links: ["Safety guide", "Trust center", "Status", "Support"] },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div className="min-w-0">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              RESQORA is an AI-powered emergency intelligence platform built for speed, clarity, and
              trust when every second counts.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.title} className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground">{column.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link}>
                      <Link
                        to="/dashboard"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} RESQORA. Interface preview — not an emergency service.</p>
          <p>In a real emergency, always contact your local emergency number.</p>
        </div>
      </div>
    </footer>
  );
}
