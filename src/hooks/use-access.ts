import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { accessQuery, type ApprovalStatus } from "@/lib/access";

/**
 * Single source of truth for feature gating: an account reaches protected
 * emergency features only once an administrator approves it. Admins always pass.
 */
export function useAccess() {
  const { user, loading } = useAuth();
  const query = useQuery(accessQuery(user?.id));
  const status: ApprovalStatus = query.data?.status ?? "pending";
  const isAdmin = query.data?.isAdmin ?? false;
  // Signed-out visitors browse the public marketing surfaces untouched — gating
  // only applies to accounts that exist and have not been approved yet.
  const signedIn = Boolean(user);
  return {
    status,
    isAdmin,
    signedIn,
    approved: !signedIn || isAdmin || status === "approved",
    pending: signedIn && !isAdmin && status === "pending",
    rejected: signedIn && !isAdmin && status === "rejected",
    loading: loading || (signedIn && query.isLoading),
  };
}
