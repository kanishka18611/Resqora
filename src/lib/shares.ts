import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ActivityLog = Database["public"]["Tables"]["activity_logs"]["Row"];

/** Recent share/alert activity, used by the emergency share centre. */
export const recentSharesQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["recent-shares", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<ActivityLog[]> => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", userId!)
        .or(
          "action.ilike.%shared%,action.ilike.%share%,action.ilike.%email%,action.ilike.%sharing%",
        )
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw new Error(error.message);
      return data as ActivityLog[];
    },
  });
