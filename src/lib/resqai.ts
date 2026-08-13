/**
 * RESQ AI — flagship AI emergency medical assistant.
 *
 * Presentation-layer vocabulary (tagline, greeting, quick questions) and the
 * favourite-chat persistence. The clinical brain, language catalogue and chat
 * history live in `@/lib/medai`, which this module extends rather than repeats.
 */
import { supabase } from "@/integrations/supabase/client";
import { firstAidLibrary, languages, type FirstAidTopic, type LanguageCode } from "@/lib/medai";

export const RESQ_AI_NAME = "RESQ AI";
export const RESQ_AI_TAGLINE = "Your AI Emergency Medical Assistant";

export const RESQ_AI_DISCLAIMER =
  "RESQ AI provides educational information and emergency first-aid guidance. It is not a substitute for a licensed medical professional. In life-threatening situations, activate SOS or contact emergency services immediately.";

export const localisedTagline: Record<LanguageCode, string> = {
  en: RESQ_AI_TAGLINE,
  hi: "आपका AI आपातकालीन चिकित्सा सहायक",
  te: "మీ AI అత్యవసర వైద్య సహాయకుడు",
};

export function greetingFor(language: LanguageCode) {
  return languages[language].greeting;
}

export type QuickQuestion = { id: string; label: string; emoji: string; prompt: string };

/** Suggestion chips shown on the RESQ AI home screen. */
export const quickQuestions: QuickQuestion[] = [
  {
    id: "accident",
    label: "I met with an accident",
    emoji: "🚗",
    prompt:
      "I met with a road accident. I have pain and some bleeding — what should I do right now?",
  },
  {
    id: "chest",
    label: "Chest pain",
    emoji: "🫀",
    prompt: "I have severe chest pain spreading to my left arm and I feel sweaty.",
  },
  {
    id: "fever",
    label: "High fever",
    emoji: "🌡️",
    prompt: "High fever of 103°F since last night with body aches and chills.",
  },
  {
    id: "snake",
    label: "Snake bite",
    emoji: "🐍",
    prompt: "Someone was bitten by a snake on the leg a few minutes ago.",
  },
  {
    id: "burn",
    label: "Burn",
    emoji: "🔥",
    prompt: "I burnt my hand with hot oil and blisters are forming.",
  },
  {
    id: "child",
    label: "Child emergency",
    emoji: "🧒",
    prompt: "My 4 year old child is vomiting, very drowsy and refusing water.",
  },
  {
    id: "breath",
    label: "Difficulty breathing",
    emoji: "🫁",
    prompt: "I am struggling to breathe and my chest feels tight.",
  },
  {
    id: "medicine",
    label: "Medicine advice",
    emoji: "💊",
    prompt:
      "What general painkiller is usually safe for an adult with a headache, and what should I avoid?",
  },
  {
    id: "cpr",
    label: "CPR guidance",
    emoji: "🫱",
    prompt: "Someone has collapsed and is not breathing. Guide me through CPR step by step.",
  },
  {
    id: "bp",
    label: "Blood pressure",
    emoji: "📈",
    prompt: "My blood pressure reading is 165/100 today. What should I do?",
  },
];

/** First-aid topics offered as guided step-by-step cards. */
export const firstAidTopics: FirstAidTopic[] = firstAidLibrary;

export function findFirstAidTopic(id: string) {
  return firstAidTopics.find((topic) => topic.id === id) ?? null;
}

/** Star or unstar a saved consultation. */
export async function setConversationFavourite(id: string, favourite: boolean) {
  const { error } = await supabase
    .from("medai_conversations")
    .update({ is_favourite: favourite })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Human-friendly message time, e.g. "14:32". */
export function messageTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
