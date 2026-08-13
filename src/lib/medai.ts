/**
 * RESQORA MedAI — the emergency medical assistant domain layer.
 *
 * Holds the language catalogue, urgency scale, specialist directory, offline
 * first-aid library and the Supabase-backed conversation history. The chat UI
 * and the AI server function both read their shared vocabulary from here.
 */
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { PlaceCategory } from "@/lib/nearby.server";

export type MedAiConversation = Database["public"]["Tables"]["medai_conversations"]["Row"];
export type MedAiMessageRow = Database["public"]["Tables"]["medai_messages"]["Row"];

export const MEDAI_DISCLAIMER =
  "This AI provides emergency guidance and first-aid information. It does not replace a qualified healthcare professional. In a life-threatening emergency, activate SOS or contact emergency services immediately.";

/* -------------------------------- languages ------------------------------- */

export type LanguageCode = "en" | "hi" | "te";

export type LanguageMeta = {
  code: LanguageCode;
  flag: string;
  label: string;
  nativeLabel: string;
  /** BCP-47 locale used by speech recognition and speech synthesis. */
  locale: string;
  greeting: string;
  placeholder: string;
  disclaimer: string;
};

export const languages: Record<LanguageCode, LanguageMeta> = {
  en: {
    code: "en",
    flag: "🇬🇧",
    label: "English",
    nativeLabel: "English",
    locale: "en-IN",
    greeting:
      "I'm RESQORA MedAI. Tell me what happened and what symptoms you're seeing — I'll assess urgency, give first-aid steps and point you to the right specialist.",
    placeholder: "Describe the symptoms…",
    disclaimer: MEDAI_DISCLAIMER,
  },
  hi: {
    code: "hi",
    flag: "🇮🇳",
    label: "Hindi",
    nativeLabel: "हिन्दी",
    locale: "hi-IN",
    greeting:
      "मैं RESQORA MedAI हूँ। बताइए क्या हुआ और कौन से लक्षण हैं — मैं गंभीरता बताऊँगा, प्राथमिक उपचार के कदम और सही विशेषज्ञ सुझाऊँगा।",
    placeholder: "लक्षण बताइए…",
    disclaimer:
      "यह AI आपातकालीन मार्गदर्शन और प्राथमिक उपचार की जानकारी देता है। यह किसी योग्य डॉक्टर का विकल्प नहीं है। जान का खतरा हो तो तुरंत SOS चालू करें या आपातकालीन सेवाओं को बुलाएँ।",
  },
  te: {
    code: "te",
    flag: "🇮🇳",
    label: "Telugu",
    nativeLabel: "తెలుగు",
    locale: "te-IN",
    greeting:
      "నేను RESQORA MedAI. ఏమి జరిగింది, ఏ లక్షణాలు ఉన్నాయో చెప్పండి — తీవ్రతను అంచనా వేసి, ప్రథమ చికిత్స దశలు మరియు సరైన స్పెషలిస్ట్‌ను సూచిస్తాను.",
    placeholder: "లక్షణాలను వివరించండి…",
    disclaimer:
      "ఈ AI అత్యవసర మార్గదర్శకత్వం మరియు ప్రథమ చికిత్స సమాచారాన్ని అందిస్తుంది. ఇది అర్హత కలిగిన వైద్యునికి ప్రత్యామ్నాయం కాదు. ప్రాణాపాయ పరిస్థితిలో వెంటనే SOS ఆన్ చేయండి లేదా అత్యవసర సేవలను సంప్రదించండి.",
  },
};

export const languageList = [languages.en, languages.hi, languages.te];

/* --------------------------------- urgency -------------------------------- */

export type Urgency = "low" | "moderate" | "high" | "critical";

export const urgencyMeta: Record<
  Urgency,
  { label: string; dot: string; chip: string; emoji: string; advice: string }
> = {
  low: {
    label: "Low urgency",
    emoji: "🟢",
    dot: "bg-safe",
    chip: "bg-safe/15 text-safe-foreground",
    advice: "Self-care and a routine consultation are usually enough.",
  },
  moderate: {
    label: "Moderate urgency",
    emoji: "🟡",
    dot: "bg-primary",
    chip: "bg-primary/15 text-primary",
    advice: "See a doctor today — don't wait for symptoms to worsen.",
  },
  high: {
    label: "High urgency",
    emoji: "🟠",
    dot: "bg-warning",
    chip: "bg-warning/20 text-warning-foreground",
    advice: "Go to an emergency department now, ideally with someone driving.",
  },
  critical: {
    label: "Critical",
    emoji: "🔴",
    dot: "bg-alert",
    chip: "bg-alert/20 text-alert",
    advice: "This may be life-threatening. Activate SOS and call emergency services.",
  },
};

export const urgencyOrder: Urgency[] = ["low", "moderate", "high", "critical"];

export function isEmergencyUrgency(urgency: Urgency | null | undefined) {
  return urgency === "high" || urgency === "critical";
}

/* ------------------------------- specialists ------------------------------ */

export const specialists = [
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
] as const;

export type Specialist = (typeof specialists)[number];

/** Which nearby-services category best serves a recommended specialist. */
export function categoryForSpecialist(specialist: string | null): PlaceCategory {
  if (!specialist) return "hospital";
  return "hospital";
}

/* ----------------------------- first-aid library -------------------------- */

export type FirstAidTopic = {
  id: string;
  title: string;
  emoji: string;
  urgency: Urgency;
  specialist: Specialist;
  steps: string[];
};

export const firstAidLibrary: FirstAidTopic[] = [
  {
    id: "heart-attack",
    title: "Heart attack",
    emoji: "🫀",
    urgency: "critical",
    specialist: "Cardiologist",
    steps: [
      "Call emergency services (108) or activate SOS immediately.",
      "Sit the person down, half-upright, and keep them calm and still.",
      "Loosen tight clothing; do not let them walk around.",
      "If not allergic and fully conscious, give one adult aspirin to chew slowly.",
      "If they stop breathing, start CPR: 30 compressions at 100–120/min, then 2 breaths.",
      "Stay with them until responders arrive and note the time symptoms started.",
    ],
  },
  {
    id: "stroke",
    title: "Stroke",
    emoji: "🧠",
    urgency: "critical",
    specialist: "Neurologist",
    steps: [
      "Run the FAST check: Face droop, Arm weakness, Speech trouble, Time to call.",
      "Call emergency services or activate SOS — note the exact time symptoms began.",
      "Lay the person on their side with head slightly raised.",
      "Give nothing to eat or drink, including medicine or water.",
      "Do not let them sleep it off; keep monitoring breathing.",
    ],
  },
  {
    id: "road-accident",
    title: "Road accident",
    emoji: "🚗",
    urgency: "critical",
    specialist: "Emergency Physician",
    steps: [
      "Secure the scene: hazard lights, oncoming traffic, no smoking near fuel.",
      "Call for help and activate SOS with your live location.",
      "Do not move the injured unless there is fire or immediate danger.",
      "Control heavy bleeding with firm direct pressure.",
      "Support the head and neck in line if a spinal injury is possible.",
      "Keep the person warm and talk to them until responders arrive.",
    ],
  },
  {
    id: "severe-bleeding",
    title: "Severe bleeding",
    emoji: "🩸",
    urgency: "critical",
    specialist: "Emergency Physician",
    steps: [
      "Wear gloves or use a clean barrier if available.",
      "Press hard on the wound with a clean cloth and keep pressing.",
      "Add more layers on top — never remove soaked dressings.",
      "Raise the injured limb above heart level if possible.",
      "Apply a tourniquet above the wound only if bleeding will not stop.",
      "Treat for shock: lay them flat, keep warm, and get to hospital now.",
    ],
  },
  {
    id: "burns",
    title: "Burns",
    emoji: "🔥",
    urgency: "high",
    specialist: "Emergency Physician",
    steps: [
      "Move away from the heat source and stop the burning.",
      "Cool the burn under clean running water for 20 minutes.",
      "Remove rings, watches and tight clothing before swelling starts.",
      "Cover loosely with cling film or a clean non-fluffy cloth.",
      "Never apply ice, butter, oil or toothpaste, and do not burst blisters.",
      "Go to hospital for facial, airway, deep or large burns.",
    ],
  },
  {
    id: "fracture",
    title: "Fracture",
    emoji: "🦴",
    urgency: "high",
    specialist: "Orthopedic Surgeon",
    steps: [
      "Keep the limb still — support it in the position found.",
      "Immobilise with a splint or padding, including the joints above and below.",
      "Apply a cold pack wrapped in cloth for swelling.",
      "Do not try to straighten or push back a deformed limb or bone.",
      "Watch for pale, cold or numb fingers/toes and report it at hospital.",
    ],
  },
  {
    id: "snake-bite",
    title: "Snake bite",
    emoji: "🐍",
    urgency: "critical",
    specialist: "Emergency Physician",
    steps: [
      "Move away from the snake; do not try to catch or kill it.",
      "Keep the person calm and completely still — movement spreads venom.",
      "Keep the bitten limb below heart level and immobilised.",
      "Remove rings and tight items; mark the swelling edge with the time.",
      "Never cut, suck, apply ice or use a tight tourniquet.",
      "Get to a hospital with antivenom immediately.",
    ],
  },
  {
    id: "electric-shock",
    title: "Electric shock",
    emoji: "⚡",
    urgency: "critical",
    specialist: "Emergency Physician",
    steps: [
      "Switch off the power at the mains before touching the person.",
      "If the power cannot be cut, push them clear with a dry non-conductive object.",
      "Check breathing; start CPR if absent and send for an AED.",
      "Cool any burns with running water and cover loosely.",
      "Get medical review even if they feel fine — heart rhythm can change later.",
    ],
  },
  {
    id: "choking",
    title: "Choking",
    emoji: "😮",
    urgency: "critical",
    specialist: "Emergency Physician",
    steps: [
      "Ask “Are you choking?” — if they can cough forcefully, let them cough.",
      "If the airway is blocked, give 5 firm back blows between the shoulder blades.",
      "Then give 5 abdominal thrusts (Heimlich) just above the navel.",
      "Alternate back blows and thrusts until the object clears.",
      "For infants: 5 back blows and 5 chest thrusts — no abdominal thrusts.",
      "If they go unconscious, call for help and start CPR.",
    ],
  },
  {
    id: "high-fever",
    title: "High fever",
    emoji: "🌡️",
    urgency: "moderate",
    specialist: "General Physician",
    steps: [
      "Measure and note the temperature and the time.",
      "Give plenty of fluids in small, frequent sips.",
      "Use light clothing and a room-temperature sponge — never ice baths.",
      "Give paracetamol at the correct weight-based dose if not contraindicated.",
      "Seek urgent care for fever with stiff neck, rash, fits, or in infants under 3 months.",
    ],
  },
  {
    id: "heat-stroke",
    title: "Heat stroke",
    emoji: "☀️",
    urgency: "critical",
    specialist: "Emergency Physician",
    steps: [
      "Move to a cool, shaded place immediately and call for help.",
      "Remove excess clothing and cool the skin with water and fanning.",
      "Place cold packs at the neck, armpits and groin.",
      "Give cool water only if fully alert.",
      "Keep cooling until responders take over — heat stroke can be fatal.",
    ],
  },
  {
    id: "poisoning",
    title: "Poisoning",
    emoji: "☠️",
    urgency: "critical",
    specialist: "Emergency Physician",
    steps: [
      "Identify the substance and keep the container or label.",
      "Do NOT induce vomiting unless a poison centre tells you to.",
      "Rinse the mouth and remove contaminated clothing.",
      "For skin or eye contact, rinse with running water for 15 minutes.",
      "Take the person and the container to hospital immediately.",
    ],
  },
  {
    id: "asthma",
    title: "Asthma attack",
    emoji: "🫁",
    urgency: "high",
    specialist: "Pulmonologist",
    steps: [
      "Sit upright — never lie down; loosen tight clothing.",
      "Take 1 puff of the reliever inhaler every 30–60 seconds, up to 10 puffs.",
      "Use a spacer if available and encourage slow, steady breaths.",
      "Call emergency services if there is no improvement after 10 puffs.",
      "Repeat the inhaler while waiting for help.",
    ],
  },
  {
    id: "allergic-reaction",
    title: "Allergic reaction",
    emoji: "🐝",
    urgency: "critical",
    specialist: "Emergency Physician",
    steps: [
      "Look for swelling of lips/throat, wheeze, rash or faintness.",
      "Use an adrenaline auto-injector into the outer thigh without delay.",
      "Call emergency services even if symptoms improve.",
      "Lie the person flat with legs raised; sit up only if breathing is hard.",
      "Give a second injector after 5 minutes if there is no improvement.",
    ],
  },
  {
    id: "seizure",
    title: "Seizure",
    emoji: "🧩",
    urgency: "high",
    specialist: "Neurologist",
    steps: [
      "Time the seizure and clear hard objects away from the person.",
      "Cushion the head; do not restrain them or put anything in the mouth.",
      "Once shaking stops, roll them onto their side to protect the airway.",
      "Stay with them until they are fully alert and reassure them.",
      "Call for help if it lasts over 5 minutes, repeats, or it's their first seizure.",
    ],
  },
];

export const quickSymptoms: { id: string; label: string; prompt: string; emoji: string }[] = [
  {
    id: "chest",
    label: "Chest pain",
    emoji: "🫀",
    prompt: "I have severe chest pain and it spreads to my left arm.",
  },
  {
    id: "breath",
    label: "Can't breathe",
    emoji: "🫁",
    prompt: "I am struggling to breathe and feel tightness in my chest.",
  },
  {
    id: "bleeding",
    label: "Heavy bleeding",
    emoji: "🩸",
    prompt: "There is heavy bleeding from a deep cut that will not stop.",
  },
  {
    id: "unconscious",
    label: "Unconscious",
    emoji: "😶",
    prompt: "Someone has collapsed and is not responding to me.",
  },
  {
    id: "fever",
    label: "High fever",
    emoji: "🌡️",
    prompt: "High fever of 103°F since last night with body aches.",
  },
  {
    id: "head",
    label: "Head injury",
    emoji: "🤕",
    prompt: "I fell and hit my head, now I feel dizzy and nauseous.",
  },
  {
    id: "burn",
    label: "Burn",
    emoji: "🔥",
    prompt: "I burnt my hand on hot oil and blisters are forming.",
  },
  {
    id: "stroke",
    label: "Face droop",
    emoji: "🧠",
    prompt: "One side of the face is drooping and speech is slurred.",
  },
];

/* ------------------------------ chat history ------------------------------ */

export type MedAiChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  hasImage?: boolean;
  urgency?: Urgency | null;
  specialist?: string | null;
  createdAt?: string;
};

export const conversationsQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["medai-conversations", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medai_conversations")
        .select("*")
        .eq("user_id", userId!)
        .order("updated_at", { ascending: false })
        .limit(40);
      if (error) throw new Error(error.message);
      return (data ?? []) as MedAiConversation[];
    },
  });

export const conversationMessagesQuery = (conversationId: string | null) =>
  queryOptions({
    queryKey: ["medai-messages", conversationId],
    enabled: Boolean(conversationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medai_messages")
        .select("*")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as MedAiMessageRow[];
    },
  });

export function rowsToMessages(rows: MedAiMessageRow[]): MedAiChatMessage[] {
  return rows.map((row) => ({
    id: row.id,
    role: row.role === "assistant" ? "assistant" : "user",
    content: row.content,
    hasImage: row.has_image,
    urgency: (row.urgency as Urgency | null) ?? null,
    specialist: row.specialist,
    createdAt: row.created_at,
  }));
}

export async function createConversation(input: {
  userId: string;
  language: LanguageCode;
  title: string;
  sharedMedicalHistory: boolean;
}) {
  const { data, error } = await supabase
    .from("medai_conversations")
    .insert({
      user_id: input.userId,
      language: input.language,
      title: input.title.slice(0, 80),
      shared_medical_history: input.sharedMedicalHistory,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as MedAiConversation;
}

export async function appendMessage(input: {
  conversationId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  hasImage?: boolean;
  urgency?: Urgency | null;
  specialist?: string | null;
}) {
  const { data, error } = await supabase
    .from("medai_messages")
    .insert({
      conversation_id: input.conversationId,
      user_id: input.userId,
      role: input.role,
      content: input.content,
      has_image: input.hasImage ?? false,
      urgency: input.urgency ?? null,
      specialist: input.specialist ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as MedAiMessageRow;
}

export async function touchConversation(input: {
  conversationId: string;
  urgency?: Urgency | null;
  specialist?: string | null;
  language?: LanguageCode;
  title?: string;
}) {
  const patch: Database["public"]["Tables"]["medai_conversations"]["Update"] = {
    updated_at: new Date().toISOString(),
  };
  if (input.urgency) patch.urgency = input.urgency;
  if (input.specialist) patch.specialist = input.specialist;
  if (input.language) patch.language = input.language;
  if (input.title) patch.title = input.title.slice(0, 80);
  const { error } = await supabase
    .from("medai_conversations")
    .update(patch)
    .eq("id", input.conversationId);
  if (error) throw new Error(error.message);
}

export async function deleteConversation(id: string) {
  const { error } = await supabase.from("medai_conversations").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteAllConversations(userId: string) {
  const { error } = await supabase.from("medai_conversations").delete().eq("user_id", userId);
  if (error) throw new Error(error.message);
}
