import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ActivityLog = Database["public"]["Tables"]["activity_logs"]["Row"];

export const ACTIVITY_ACTIONS = [
  "Signed in",
  "SOS activated",
  "Location shared",
  "Emergency closed",
  "Profile updated",
] as const;

/** Fire-and-forget audit trail entry. Never blocks the calling flow. */
export async function logActivity(userId: string | undefined, action: string, detail?: string) {
  if (!userId) return;
  try {
    await supabase
      .from("activity_logs")
      .insert({ user_id: userId, action, detail: detail ?? null });
  } catch {
    /* activity logging must never break a user action */
  }
}

export const activityQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["activity-logs", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw new Error(error.message);
      return data as ActivityLog[];
    },
  });
