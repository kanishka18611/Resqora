export type TriageAnswer = { questionId: string; label: string; weight: number };

export type TriageQuestion = {
  id: string;
  prompt: string;
  options: { label: string; weight: number }[];
};

export const triageQuestions: TriageQuestion[] = [
  {
    id: "situation",
    prompt: "What happened?",
    options: [
      { label: "Medical emergency", weight: 3 },
      { label: "Road accident", weight: 4 },
      { label: "Fire or smoke", weight: 5 },
      { label: "Assault or crime", weight: 4 },
    ],
  },
  {
    id: "breathing",
    prompt: "Can you (or they) breathe normally?",
    options: [
      { label: "Breathing normally", weight: 0 },
      { label: "Struggling to breathe", weight: 4 },
      { label: "Not breathing", weight: 8 },
    ],
  },
  {
    id: "bleeding",
    prompt: "Is there any bleeding?",
    options: [
      { label: "No bleeding", weight: 0 },
      { label: "Minor bleeding", weight: 2 },
      { label: "Heavy or spurting", weight: 7 },
    ],
  },
  {
    id: "mobility",
    prompt: "Can you move away from danger?",
    options: [
      { label: "Yes, freely", weight: 0 },
      { label: "With difficulty", weight: 3 },
      { label: "No, trapped or immobile", weight: 6 },
    ],
  },
  {
    id: "alone",
    prompt: "Are you alone right now?",
    options: [
      { label: "Someone is with me", weight: 0 },
      { label: "I am completely alone", weight: 3 },
    ],
  },
  {
    id: "injured",
    prompt: "How many people are injured?",
    options: [
      { label: "Just one", weight: 1 },
      { label: "Two or three", weight: 4 },
      { label: "Four or more", weight: 6 },
    ],
  },
  {
    id: "consciousness",
    prompt: "Is anyone unconscious?",
    options: [
      { label: "Everyone is alert", weight: 0 },
      { label: "Someone is drowsy or confused", weight: 4 },
      { label: "Someone is unconscious", weight: 8 },
    ],
  },
];

/** Highest achievable raw score across every question. */
export const MAX_RAW_SCORE = triageQuestions.reduce(
  (total, question) => total + Math.max(...question.options.map((option) => option.weight)),
  0,
);

/** Normalises the raw weighted score onto the 0–100 severity scale. */
export function toSeverityScore(raw: number) {
  return Math.min(100, Math.round((raw / MAX_RAW_SCORE) * 100));
}

export type Severity = "low" | "medium" | "high" | "critical";

/** Accepts the normalised 0–100 severity score. */
export function scoreToSeverity(score: number): Severity {
  if (score >= 70) return "critical";
  if (score >= 45) return "high";
  if (score >= 20) return "medium";
  return "low";
}

export const severityPriority: Record<Severity, { priority: string; eta: string }> = {
  low: { priority: "P4 — routine", eta: "Advice only, no dispatch required" },
  medium: { priority: "P3 — standard", eta: "Responder assigned within ~15 minutes" },
  high: { priority: "P2 — urgent", eta: "Responder assigned within ~8 minutes" },
  critical: { priority: "P1 — immediate", eta: "Nearest unit dispatched immediately" },
};

/** Emergency services suggested from the answers given. */
export function suggestedServices(answers: Record<string, string>, severity: Severity): string[] {
  const services = new Set<string>();
  if (severity !== "low") services.add("Ambulance / paramedics");
  if (answers.situation === "Fire or smoke") services.add("Fire & rescue");
  if (answers.situation === "Assault or crime") services.add("Police");
  if (answers.situation === "Road accident") {
    services.add("Police");
    services.add("Fire & rescue");
  }
  if (answers.bleeding === "Heavy or spurting") services.add("Blood bank / trauma centre");
  if (answers.breathing === "Not breathing" || answers.consciousness === "Someone is unconscious") {
    services.add("Advanced life support unit");
  }
  if (services.size === 0) services.add("Nearest pharmacy or clinic");
  return [...services];
}

export const severityMeta: Record<
  Severity,
  { label: string; status: "safe" | "warning" | "critical" | "active"; summary: string }
> = {
  low: {
    label: "Low severity",
    status: "safe",
    summary: "Self-care is likely enough. Keep monitoring and call for help if anything changes.",
  },
  medium: {
    label: "Medium severity",
    status: "active",
    summary: "Get seen by a clinician today. Do not leave the person alone.",
  },
  high: {
    label: "High severity",
    status: "warning",
    summary: "Urgent care needed. Trigger an SOS and prepare for responders to arrive.",
  },
  critical: {
    label: "Critical severity",
    status: "critical",
    summary: "Life-threatening. Trigger SOS immediately and begin first aid now.",
  },
};

export function firstAidSteps(answers: Record<string, string>, severity: Severity): string[] {
  const steps: string[] = ["Check the scene is safe before approaching."];

  if (answers.breathing === "Not breathing") {
    steps.push("Start CPR: 30 chest compressions at 100–120/min, then 2 rescue breaths. Repeat.");
    steps.push("Send someone for an AED if one is nearby.");
  } else if (answers.consciousness === "Someone is unconscious") {
    steps.push("Place them in the recovery position on their side and keep the airway open.");
  } else if (answers.breathing === "Struggling to breathe") {
    steps.push("Sit them upright, loosen tight clothing and keep the air around them clear.");
  }

  if (answers.bleeding === "Heavy or spurting") {
    steps.push(
      "Apply firm direct pressure with a clean cloth. Do not remove soaked dressings — add more on top.",
    );
    steps.push("Raise the injured limb above heart level if there is no suspected fracture.");
  } else if (answers.bleeding === "Minor bleeding") {
    steps.push("Clean the wound with water and cover it with a sterile dressing.");
  }

  if (answers.situation === "Fire or smoke") {
    steps.push(
      "Stay low under the smoke and move to fresh air immediately — never re-enter a burning space.",
    );
  }

  if (answers.alone === "I am completely alone") {
    steps.push("Unlock the door if you safely can, so responders can reach you without delay.");
  }

  if (answers.mobility === "No, trapped or immobile") {
    steps.push("Do not move them unless there is immediate danger — wait for trained responders.");
  }

  steps.push("Keep them warm, talk calmly and stay with them until help arrives.");

  if (severity === "critical" || severity === "high") {
    steps.push(
      "Trigger an RESQORA SOS now so responders and your contacts get your live location.",
    );
  }

  return steps;
}
