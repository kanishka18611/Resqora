import { Link } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/system/theme-toggle";
import { ProfileMenu } from "@/components/layouts/profile-menu";
import { useAuth } from "@/hooks/use-auth";

export function LandingNav() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-card">
      <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6 sm:py-4">
        <Link to="/" aria-label="RESQORA home" className="min-w-0">
          <Logo size="lg" tagline="Emergency Response" />
        </Link>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <ThemeToggle />
          {user ? (
            <ProfileMenu />
          ) : (
            <Link
              to="/auth"
              aria-label="Sign in"
              className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-secondary text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <UserRound className="size-5" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
