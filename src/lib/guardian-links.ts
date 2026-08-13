import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type GuardianLink = {
  emergency_id: string;
  token: string;
  victim_name: string;
  emergency_status: string;
  started_at: string;
};

/**
 * Active Guardian command-centre links for the signed-in user. The database
 * only returns rows where the account email matches the nominated Guardian of
 * a still-running emergency, so nothing leaks to anyone else.
 */
export const myGuardianLinksQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["guardian-links", userId],
    enabled: Boolean(userId),
    refetchInterval: 30_000,
    queryFn: async (): Promise<GuardianLink[]> => {
      const { data, error } = await supabase.rpc("my_guardian_links");
      if (error) throw new Error(error.message);
      return (data ?? []) as GuardianLink[];
    },
  });
