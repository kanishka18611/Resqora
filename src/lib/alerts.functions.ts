import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  message: z.string().min(10).max(2000),
  recipients: z
    .array(z.object({ id: z.string(), name: z.string(), phone: z.string() }))
    .min(1)
    .max(10),
});

export type SendResult = {
  id: string;
  status: "delivered" | "failed";
  error?: string;
};

export type SendAlertsResponse = {
  /** false when no SMS provider is connected — the UI falls back to manual channels. */
  configured: boolean;
  results: SendResult[];
};

/**
 * Sends the emergency alert over SMS through the connected GatewayAPI account.
 * When no provider is connected the call returns configured:false so the client
 * can hand the exact same message to WhatsApp / SMS / email apps instead.
 */
export const sendEmergencyAlerts = createServerFn({ method: "POST" })
  .validator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<SendAlertsResponse> => {
    const connectionKey = process.env.GATEWAYAPI_API_KEY;
    if (!connectionKey) return { configured: false, results: [] };

    const results: SendResult[] = [];
    for (const recipient of data.recipients) {
      const msisdn = Number(recipient.phone.replace(/[^\d]/g, ""));
      if (!msisdn) {
        results.push({ id: recipient.id, status: "failed", error: "Invalid phone number" });
        continue;
      }
      try {
        const response = await fetch("https://gatewayapi.com/rest/mtsms", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${connectionKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender: "RESQORA",
            recipients: [{ msisdn }],
            message: data.message.slice(0, 1000),
          }),
        });
        if (!response.ok) {
          const body = await response.text();
          console.error(`RESQORA SMS failed [${response.status}]: ${body}`);
          results.push({
            id: recipient.id,
            status: "failed",
            error: `Provider error ${response.status}`,
          });
          continue;
        }
        results.push({ id: recipient.id, status: "delivered" });
      } catch (error) {
        results.push({
          id: recipient.id,
          status: "failed",
          error: error instanceof Error ? error.message : "Network error",
        });
      }
    }
    return { configured: true, results };
  });
