import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { runOpenRouter } from "@/lib/openrouter.server";

const Input = z.object({
  description: z.string().min(3).max(2000),
});

export type EmergencyAnalysis = {
  emergencyType: "accident" | "fire" | "medical" | "crime" | "natural" | "sos";
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  summary: string;
  recommendedResponse: string;
  firstAid: string[];
};

const SYSTEM = `You are RESQORA, an emergency triage model used while help is being dispatched.
Read the caller's description of what happened and respond ONLY with compact JSON:
{"emergencyType":"accident|fire|medical|crime|natural|sos","severity":"low|medium|high|critical","confidence":0-100,"summary":"one sentence","recommendedResponse":"which services should respond and why, one sentence","firstAid":["short imperative step"]}
Give 3-5 firstAid steps that a bystander can safely perform right now. Never tell the user to delay calling emergency services.`;

export const analyzeEmergencyDescription = createServerFn({ method: "POST" })
  .validator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<EmergencyAnalysis> => {
    const { enforceLimit } = await import("@/lib/rate-limit.server");
    enforceLimit(getRequest(), "analysis", 12, 60_000);
    const text = await runOpenRouter({
      system: SYSTEM,
      user: data.description,
      temperature: 0.2,
      maxTokens: 512,
    });
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not read the AI analysis");

    const parsed = JSON.parse(match[0]) as Partial<EmergencyAnalysis>;
    return {
      emergencyType: (parsed.emergencyType ?? "sos") as EmergencyAnalysis["emergencyType"],
      severity: (parsed.severity ?? "medium") as EmergencyAnalysis["severity"],
      confidence: Math.max(0, Math.min(100, Math.round(Number(parsed.confidence ?? 60)))),
      summary: parsed.summary ?? "Emergency description analysed.",
      recommendedResponse: parsed.recommendedResponse ?? "Emergency services should be contacted.",
      firstAid: Array.isArray(parsed.firstAid) ? parsed.firstAid.slice(0, 6).map(String) : [],
    };
  });
