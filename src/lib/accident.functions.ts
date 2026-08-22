import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { runOpenRouter } from "@/lib/openrouter.server";
import {
  FIRST_AID_FALLBACK,
  type AccidentReport,
  type AccidentSeverity,
  type CoreEmergencyType,
  type HospitalSpecialty,
} from "@/lib/accident";

const Input = z.object({
  // Only base64 image data URLs — a video is reduced to a key frame in-browser.
  imageDataUrl: z
    .string()
    .min(32)
    .max(8_000_000)
    .regex(
      /^data:image\/(jpeg|jpg|png|webp|heic);base64,[A-Za-z0-9+/=\s]+$/,
      "Unsupported image format",
    ),
  mediaKind: z.enum(["photo", "video"]).default("photo"),
  address: z.string().max(300).nullish(),
  capturedAt: z.string().max(40).nullish(),
});

const SYSTEM = `You are RESQORA, an emergency triage vision model supporting first responders.
Examine the accident scene and produce AI-assisted observations only — never a confirmed diagnosis.

Respond ONLY with compact JSON:
{"incidentLabel":"Vehicle collision|Motorcycle crash|Fire|Person lying motionless|Building collapse|Flood|Electrical hazard|Smoke|Road obstruction|other short label",
"emergencyType":"accident|fire|medical|crime|natural|sos",
"severity":"minor|moderate|serious|critical",
"confidence":0-100,
"summary":"one or two factual sentences about what is visible",
"observations":["short visible situation"],
"possibleInjuries":["Possible head injury","Heavy external bleeding","Fracture suspected","Burns suspected","Unconscious victim","Trapped occupant"],
"hazards":["short scene hazard such as fuel leak, live wire, oncoming traffic, smoke"],
"victimCount":number or null,
"hospitalSpecialty":"trauma|cardiac|neuro|burn|pediatric|maternity|general",
"firstAidTitle":"short title",
"firstAid":["one clear imperative step"],
"recommendedActions":["short next action for the reporter"]}

Rules: only list injuries suggested by what is visible, prefix them with "Possible"/"Suspected" wording where uncertain, keep every string under 120 characters, return 3-6 firstAid steps.
If the media shows no emergency, use severity "minor", low confidence and say so in the summary.`;

const SEVERITIES: AccidentSeverity[] = ["minor", "moderate", "serious", "critical"];
const TYPES: CoreEmergencyType[] = ["accident", "fire", "medical", "crime", "natural", "sos"];
const SPECIALTIES: HospitalSpecialty[] = [
  "trauma",
  "cardiac",
  "neuro",
  "burn",
  "pediatric",
  "maternity",
  "general",
];

function strings(value: unknown, max: number) {
  return Array.isArray(value)
    ? value
        .map((item) => String(item).trim().slice(0, 140))
        .filter(Boolean)
        .slice(0, max)
    : [];
}

/** AI accident analysis → structured emergency medical report. */
export const analyzeAccidentScene = createServerFn({ method: "POST" })
  .validator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<AccidentReport> => {
    const { enforceLimit } = await import("@/lib/rate-limit.server");
    enforceLimit(getRequest(), "vision", 10, 60_000);
    const context = [
      `Media type: ${data.mediaKind}`,
      data.address ? `Reported location: ${data.address}` : null,
      data.capturedAt ? `Captured at: ${data.capturedAt}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const text = await runOpenRouter({
      system: SYSTEM,
      user: [
        { type: "text", text: `Analyse this accident scene for emergency response.\n${context}` },
        { type: "image_url", image_url: { url: data.imageDataUrl } },
      ],
      temperature: 0.2,
      maxTokens: 1024,
    });
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not read the AI analysis");
    const parsed = JSON.parse(match[0]) as Record<string, unknown>;

    const emergencyType = TYPES.includes(parsed.emergencyType as CoreEmergencyType)
      ? (parsed.emergencyType as CoreEmergencyType)
      : "accident";
    const severity = SEVERITIES.includes(parsed.severity as AccidentSeverity)
      ? (parsed.severity as AccidentSeverity)
      : "moderate";
    const fallback = FIRST_AID_FALLBACK[emergencyType];
    const steps = strings(parsed.firstAid, 8);
    const victims = Number(parsed.victimCount);

    return {
      incidentLabel: String(parsed.incidentLabel ?? "Accident scene").slice(0, 60),
      emergencyType,
      severity,
      confidence: Math.max(0, Math.min(100, Math.round(Number(parsed.confidence ?? 60)))),
      summary: String(parsed.summary ?? "Emergency scene analysed.").slice(0, 400),
      observations: strings(parsed.observations, 6),
      possibleInjuries: strings(parsed.possibleInjuries, 6),
      hazards: strings(parsed.hazards, 5),
      victimCount:
        Number.isFinite(victims) && victims > 0 ? Math.min(99, Math.round(victims)) : null,
      hospitalSpecialty: SPECIALTIES.includes(parsed.hospitalSpecialty as HospitalSpecialty)
        ? (parsed.hospitalSpecialty as HospitalSpecialty)
        : emergencyType === "fire"
          ? "burn"
          : "trauma",
      firstAid: {
        title: String(parsed.firstAidTitle ?? fallback.title).slice(0, 60),
        steps: steps.length >= 2 ? steps : fallback.steps,
      },
      recommendedActions: strings(parsed.recommendedActions, 5),
    };
  });
