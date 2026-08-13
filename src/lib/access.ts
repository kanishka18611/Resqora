import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Only this address is bootstrapped as super admin by the database trigger. */
export const SUPER_ADMIN_EMAIL = "mdr.gemini@gmail.com";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type AccessState = {
  status: ApprovalStatus;
  isAdmin: boolean;
};

/**
 * Routes a signed-in but not-yet-approved account may still open. Everything
 * else in the app is a protected emergency feature and stays locked until an
 * administrator approves the account.
 */
export const UNRESTRICTED_PATHS = ["/profile", "/about", "/support", "/settings"] as const;

export function isUnrestrictedPath(pathname: string) {
  return UNRESTRICTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/** Approval state + admin role for the signed-in user. Polled so an approval takes effect on its own. */
export const accessQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["access", userId],
    enabled: Boolean(userId),
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
    staleTime: 5_000,
    queryFn: async (): Promise<AccessState> => {
      const [profile, roles] = await Promise.all([
        supabase.from("profiles").select("approval_status").eq("id", userId!).maybeSingle(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId!)
          .eq("role", "admin")
          .maybeSingle(),
      ]);
      if (profile.error) throw new Error(profile.error.message);
      if (roles.error) throw new Error(roles.error.message);
      return {
        status: (profile.data?.approval_status ?? "pending") as ApprovalStatus,
        isAdmin: Boolean(roles.data),
      };
    },
  });

export function approvalLabel(status: ApprovalStatus) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending approval";
}
