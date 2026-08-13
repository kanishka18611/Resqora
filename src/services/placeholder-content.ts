import {
  BrainCircuit,
  Radio,
  ShieldAlert,
  Users,
  Clock3,
  Activity,
  Globe2,
  HeartPulse,
} from "lucide-react";
import type { FeaturePreview, StatPlaceholder, Testimonial } from "@/types";

export const featurePreviews: FeaturePreview[] = [
  {
    id: "triage",
    title: "AI Incident Triage",
    description:
      "Placeholder — describes how RESQORA classifies an incident and recommends the fastest route to help.",
    icon: BrainCircuit,
    tone: "info",
  },
  {
    id: "sos",
    title: "One-Tap SOS",
    description:
      "Placeholder — a single action alerts responders and shares live context from your device.",
    icon: ShieldAlert,
    tone: "alert",
  },
  {
    id: "circle",
    title: "Trusted Circle Updates",
    description:
      "Placeholder — loved ones receive calm, automatic status updates until you are safe.",
    icon: Users,
    tone: "success",
  },
  {
    id: "signal",
    title: "Live Signal Relay",
    description:
      "Placeholder — location, battery, and vitals stream to responders in a single feed.",
    icon: Radio,
    tone: "info",
  },
];

export const statPlaceholders: StatPlaceholder[] = [
  { id: "response", label: "Avg. response time", value: "—", delta: "placeholder", icon: Clock3 },
  { id: "alerts", label: "Alerts processed", value: "—", delta: "placeholder", icon: Activity },
  { id: "regions", label: "Regions covered", value: "—", delta: "placeholder", icon: Globe2 },
  { id: "uptime", label: "Platform uptime", value: "—", delta: "placeholder", icon: HeartPulse },
];

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    quote:
      "Placeholder testimonial copy describing how quickly help arrived and how calm the experience felt.",
    name: "Placeholder Name",
    role: "Community responder",
    initials: "PN",
  },
  {
    id: "t2",
    quote:
      "Placeholder testimonial copy about keeping family informed without needing to make a single call.",
    name: "Placeholder Name",
    role: "Parent of two",
    initials: "PN",
  },
  {
    id: "t3",
    quote:
      "Placeholder testimonial copy from an operations lead about coordinating field teams at scale.",
    name: "Placeholder Name",
    role: "Safety operations lead",
    initials: "PN",
  },
];
