import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Search } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/system/theme-toggle";
import { ProfileMenu } from "@/components/layouts/profile-menu";
import { StatusIndicator } from "@/components/system/status-indicator";
import { useAuth } from "@/hooks/use-auth";
import { activeEmergencyQuery, notificationsQuery } from "@/lib/api";

export function AppTopbar() {
  const { user } = useAuth();
  const { data: notifications } = useQuery(notificationsQuery(user?.id));
  const { data: activeEmergency } = useQuery(activeEmergencyQuery(user?.id));

  const unread = (notifications ?? []).filter((item) => !item.read).length;

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/" className="lg:hidden" aria-label="RESQORA home">
            <Logo />
          </Link>
          <div className="relative hidden w-full max-w-sm md:block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Search incidents, contacts, places"
              aria-label="Search"
              className="h-10 rounded-xl pl-9"
            />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {activeEmergency ? (
            <StatusIndicator
              status="critical"
              label="Emergency active"
              pulse
              className="hidden sm:inline-flex"
            />
          ) : (
            <StatusIndicator status="safe" label="All clear" className="hidden sm:inline-flex" />
          )}
          <ThemeToggle />
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
            className="relative rounded-xl"
          >
            <Link to="/notifications">
              <Bell className="size-5" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-alert px-1 text-[10px] font-bold leading-4 text-alert-foreground">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          </Button>
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
