import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  kind: z.enum(["sos", "guardian", "tracking", "resolved"]),
  emergencyId: z.string().uuid(),
  personName: z.string().trim().max(120).default("A RESQORA user"),
  detail: z.string().trim().max(300).nullish(),
  guardianUrl: z.string().trim().max(500).nullish(),
});

/**
 * Sends a real FCM push about an emergency to the owner's registered devices.
 * The caller must be signed in and must own the emergency.
 */
export const sendEmergencyPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }) => {
    const { data: emergency, error } = await context.supabase
      .from("emergencies")
      .select("id, user_id")
      .eq("id", data.emergencyId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!emergency || emergency.user_id !== context.userId) {
      throw new Response("Forbidden", { status: 403 });
    }

    const { buildEmergencyPush } = await import("@/lib/push-messages");
    const { sendPushToUser } = await import("@/lib/push.server");
    const message = buildEmergencyPush({
      kind: data.kind,
      emergencyId: data.emergencyId,
      personName: data.personName,
      detail: data.detail ?? null,
      guardianUrl: data.guardianUrl ?? null,
    });
    return sendPushToUser(context.userId, message);
  });
