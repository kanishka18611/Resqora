import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { myGuardianLinksQuery } from "@/lib/guardian-links";

/**
 * Shown at the very top of Home only when the signed-in account is the
 * nominated Guardian of a live emergency — one tap into the command centre.
 */
export function GuardianShortcut() {
  const { user } = useAuth();
  const links = useQuery(myGuardianLinksQuery(user?.id));
  const link = links.data?.[0];
  if (!link) return null;

  return (
    <a
      href={`/guardian/${link.emergency_id}/${link.token}`}
      className="flex items-center gap-3 rounded-3xl border border-alert/50 bg-alert/10 p-4 shadow-sm transition-transform hover:-translate-y-0.5 sm:p-5"
    >
      <span
        aria-hidden="true"
        className="grid size-12 shrink-0 place-items-center rounded-2xl bg-alert/15 text-alert"
      >
        <ShieldAlert className="size-6 animate-pulse" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-base font-extrabold tracking-tight text-alert">
          Guardian Dashboard
        </span>
        <span className="mt-0.5 block truncate text-sm font-semibold text-foreground">
          {link.victim_name} needs help — open the command centre
        </span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-alert" aria-hidden="true" />
    </a>
  );
}
