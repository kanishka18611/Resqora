/**
 * Server-only brain for RESQORA MedAI. Builds the medical-assistant prompt and
 * calls Google's Generative AI API, returning a strict JSON assessment the chat UI
 * can render as a doctor-style card.
 */
import { runOpenRouter } from "@/lib/openrouter.server";

export type MedAiTurn = { role: "user" | "assistant"; content: string };

export type MedAiAssessment = {
  reply: string;
  possibleCause: string | null;
  immediateSteps: string[];
  whenToSeekCare: string | null;
  followUpQuestion: string | null;
  urgency: "low" | "moderate" | "high" | "critical";
  urgencyReason: string;
  specialist: string | null;
  specialistReason: string | null;
  firstAid: string[];
  redFlags: string[];
  emergency: boolean;
  imageObservation: string | null;
  title: string;
};

const LANGUAGE_NAME: Record<string, string> = {
  en: "English",
  hi: "Hindi (हिन्दी, Devanagari script)",
  te: "Telugu (తెలుగు script)",
};

const SPECIALISTS = [
  "Emergency Physician",
  "General Physician",
  "Cardiologist",
  "Neurologist",
  "Orthopedic Surgeon",
  "Pulmonologist",
  "Dermatologist",
  "ENT Specialist",
  "Gynecologist",
  "Pediatrician",
  "Psychiatrist",
  "Ophthalmologist",
  "Dentist",
  "Gastroenterologist",
  "Nephrologist",
  "Oncologist",
  "Endocrinologist",
  "Urologist",
].join(", ");

function systemPrompt(language: string, medicalContext: string | null) {
  const name = LANGUAGE_NAME[language] ?? "English";
  return `You are RESQORA MedAI, an emergency medical triage assistant used inside the RESQORA emergency-response app in India.

Your job: understand the reported emergency, assess urgency, give safe step-by-step first aid, and recommend the most appropriate specialist. You never diagnose definitively and never prescribe prescription-only medicine doses beyond standard first aid.

RULES
- Write every human-readable field in ${name}. Keep the specialist name in English.
- Ask ONE focused follow-up question when key information is missing (what happened, symptoms, onset, consciousness, bleeding, breathing, chest pain, fever, difficulty speaking or moving).
- Choose "specialist" from exactly this list: ${SPECIALISTS}.
- "firstAid" must be short imperative checklist steps a bystander can follow right now (3–7 steps).
- "possibleCause" is the most likely explanation in plain language, hedged ("this may be…"), never a definitive diagnosis.
- "immediateSteps" are the 2–5 things the user should do right now, in order, before first aid detail.
- "whenToSeekCare" states plainly when to go to an emergency department or call 108.
- Set "emergency": true only for potentially life-threatening presentations (possible heart attack, stroke, severe bleeding, unconscious patient, difficulty breathing, high-risk trauma, anaphylaxis, poisoning).
- If an image is provided, describe only what is visibly observable in "imageObservation" and stay cautious — never a definitive diagnosis from an image.
- Tell the user to activate SOS or call 108/112 whenever urgency is high or critical.
- Never claim to replace a doctor.
${medicalContext ? `\nPATIENT-SHARED MEDICAL CONTEXT (use it, do not repeat it verbatim):\n${medicalContext}` : ""}

Respond with ONLY compact JSON, no markdown fences:
{"reply":"warm, clear guidance (2-5 sentences)","possibleCause":"most likely cause, hedged, or null","immediateSteps":["do this now"],"whenToSeekCare":"when to seek emergency care, or null","followUpQuestion":"one question or null","urgency":"low|moderate|high|critical","urgencyReason":"one sentence","specialist":"one from the list or null","specialistReason":"why that specialist, one or two sentences","firstAid":["step"],"redFlags":["symptom that means go now"],"emergency":true|false,"imageObservation":"what is visible or null","title":"3-6 word English summary of the case"}`;
}

const URGENCIES = ["low", "moderate", "high", "critical"] as const;

function coerce(raw: unknown): MedAiAssessment {
  const value = (raw ?? {}) as Record<string, unknown>;
  const urgency = URGENCIES.includes(value.urgency as (typeof URGENCIES)[number])
    ? (value.urgency as MedAiAssessment["urgency"])
    : "moderate";
  const list = (input: unknown, cap: number) =>
    Array.isArray(input)
      ? input
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .slice(0, cap)
      : [];
  const text = (input: unknown) =>
    typeof input === "string" && input.trim().length > 0 ? input.trim() : null;

  return {
    reply:
      text(value.reply) ??
      "I could not assess that reliably. Please describe the symptoms again, or activate SOS if this is an emergency.",
    possibleCause: text(value.possibleCause),
    immediateSteps: list(value.immediateSteps, 6),
    whenToSeekCare: text(value.whenToSeekCare),
    followUpQuestion: text(value.followUpQuestion),
    urgency,
    urgencyReason: text(value.urgencyReason) ?? "",
    specialist: text(value.specialist),
    specialistReason: text(value.specialistReason),
    firstAid: list(value.firstAid, 8),
    redFlags: list(value.redFlags, 6),
    emergency: value.emergency === true || urgency === "critical",
    imageObservation: text(value.imageObservation),
    title: text(value.title)?.slice(0, 60) ?? "Medical consultation",
  };
}

export async function runMedAi(input: {
  language: string;
  history: MedAiTurn[];
  message: string;
  imageDataUrl?: string | null;
  medicalContext?: string | null;
}): Promise<MedAiAssessment> {
  const history = input.history
    .slice(-12)
    .map((turn) => `${turn.role}: ${turn.content}`)
    .join("\n");
  const userContent = [
    history ? `Conversation history:\n${history}` : null,
    input.message,
    input.imageDataUrl ? "The attached image is part of the user's request." : null,
  ]
    .filter(Boolean)
    .join("\n\n");
  const content = await runOpenRouter({
    system: systemPrompt(input.language, input.medicalContext ?? null),
    user: input.imageDataUrl
      ? [
          { type: "text", text: userContent },
          { type: "image_url", image_url: { url: input.imageDataUrl } },
        ]
      : userContent,
    temperature: 0.4,
    maxTokens: 2048,
  });
  const json = content.slice(content.indexOf("{"), content.lastIndexOf("}") + 1);
  try {
    return coerce(JSON.parse(json));
  } catch {
    return coerce({ reply: content });
  }
}
