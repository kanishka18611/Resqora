import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { HeartPulse, LogOut, QrCode, Settings, ShieldCheck, UserRound, Users } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useAccess } from "@/hooks/use-access";
import { profileQuery } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { logSecurityEvent } from "@/lib/audit";

const ITEMS = [
  { label: "My Profile", to: "/profile", icon: UserRound },
  { label: "Medical Profile", to: "/medical-id", icon: HeartPulse },
  { label: "Guardian & Emergency Contacts", to: "/contacts", icon: Users },
  { label: "RESQR ID", to: "/resqr-id", icon: QrCode },
  { label: "Settings", to: "/settings", icon: Settings },
] as const;

/**
 * Account menu in the top bar. The 🛡 Admin Panel entry is rendered only when the
 * signed-in account actually holds the admin role — non-admins never see it, and
 * the /admin route itself is enforced by database policies too.
 */
export function ProfileMenu() {
  const { user } = useAuth();
  const { isAdmin } = useAccess();
  const { data: profile } = useQuery(profileQuery(user?.id));
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const name = profile?.full_name || user?.email || "Account";
  const initials = name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  async function signOut() {
    void logSecurityEvent("Signed out", "User signed out of RESQORA");
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar className="size-9">
          {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="" />}
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {initials || "RQ"}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-2xl">
        <DropdownMenuLabel className="truncate">
          <span className="block truncate text-sm font-semibold text-foreground">{name}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">
            {user?.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ITEMS.map((item) => (
          <DropdownMenuItem key={item.to} asChild className="rounded-xl">
            <Link to={item.to} className="flex items-center gap-2.5">
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="rounded-xl">
              <Link to="/admin" className="flex items-center gap-2.5 font-semibold text-primary">
                <ShieldCheck className="size-4" aria-hidden="true" />
                🛡 Admin Panel
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="rounded-xl text-alert focus:text-alert"
          onSelect={() => void signOut()}
        >
          <LogOut className="size-4" aria-hidden="true" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
