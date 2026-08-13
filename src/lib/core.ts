import { supabase } from "@/integrations/supabase/client";
import type { CoordinatorPlan } from "@/lib/coordinator.functions";
import type { Emergency, Profile } from "@/lib/api";

/**
 * RESQORA CORE — the AI emergency coordination layer that ties the Digital
 * Twin, the AI Coordinator, RESQR ID and the Accident Response Engine into a
 * single live workspace. Plans are cached per emergency on the device so the
 * workspace reopens instantly, and their summary is persisted on the emergency
 * row so guardians and operators read the same conclusion.
 */
const PLAN_KEY = "aegis.core.plan";

export type CoreModuleState = "idle" | "ready" | "live" | "attention";

export type CoreModule = {
  id: "twin" | "coordinator" | "resqr" | "accident";
  name: string;
  description: string;
  state: CoreModuleState;
  detail: string;
  to: string;
};

export const MODULE_STATE_META: Record<
  CoreModuleState,
  { label: string; chip: string; dot: string }
> = {
  idle: {
    label: "Standby",
    chip: "border-border bg-muted/50 text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  ready: {
    label: "Ready",
    chip: "border-success/40 bg-success/10 text-success",
    dot: "bg-success",
  },
  live: { label: "Live", chip: "border-alert/50 bg-alert/10 text-alert", dot: "bg-alert" },
  attention: {
    label: "Action needed",
    chip: "border-warning/50 bg-warning/10 text-warning",
    dot: "bg-warning",
  },
};

export function cachedPlan(emergencyId: string | undefined): CoordinatorPlan | null {
  if (!emergencyId || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${PLAN_KEY}.${emergencyId}`);
    return raw ? (JSON.parse(raw) as CoordinatorPlan) : null;
  } catch {
    return null;
  }
}

export function cachePlan(emergencyId: string, plan: CoordinatorPlan) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${PLAN_KEY}.${emergencyId}`, JSON.stringify(plan));
  } catch {
    /* storage full or blocked — the plan still lives in memory for this session */
  }
}

/** Mirrors the coordinator conclusion onto the emergency so every viewer agrees. */
export async function persistPlan(emergencyId: string, plan: CoordinatorPlan) {
  const { error } = await supabase
    .from("emergencies")
    .update({
      ai_summary: plan.headline,
      ai_recommendation: `${plan.hospitalType} — responder ETA ≈ ${plan.etaMinutes} min`,
      ai_first_aid: plan.actions.map((action) => `${action.role}: ${action.title}`),
    })
    .eq("id", emergencyId);
  if (error) throw new Error(error.message);
}

/** Short, responder-friendly medical line used as AI context. */
export function medicalContext(profile: Profile | null | undefined) {
  if (!profile) return undefined;
  const parts = [
    profile.blood_group ? `Blood group ${profile.blood_group}` : null,
    profile.allergies ? `Allergies: ${profile.allergies}` : null,
    profile.medical_conditions ? `Conditions: ${profile.medical_conditions}` : null,
    profile.medications ? `Medications: ${profile.medications}` : null,
    profile.preferred_hospital ? `Preferred hospital: ${profile.preferred_hospital}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(". ").slice(0, 800) : undefined;
}

export function emergencyReference(emergency: Pick<Emergency, "id">) {
  return emergency.id.slice(0, 8).toUpperCase();
}

/** Live status of the four CORE modules, derived from real account data. */
export function coreModules(input: {
  emergency: Emergency | null | undefined;
  plan: CoordinatorPlan | null;
  hasResqr: boolean;
  contactCount: number;
  lastAccidentReport: Emergency | null | undefined;
}): CoreModule[] {
  const active = Boolean(input.emergency);
  return [
    {
      id: "twin",
      name: "Emergency Digital Twin",
      description: "Live workspace mirroring your emergency: GPS, medical profile and timeline.",
      state: active ? "live" : "ready",
      detail: active
        ? `Tracking ${emergencyReference(input.emergency!)} — refreshing every 8 seconds.`
        : "Opens automatically the moment an SOS is activated.",
      to: "/digital-twin",
    },
    {
      id: "coordinator",
      name: "AI Emergency Coordinator",
      description: "Generates and regenerates the emergency action plan as new details arrive.",
      state: active ? (input.plan ? "live" : "attention") : "ready",
      detail: active
        ? input.plan
          ? `Plan ready — ${input.plan.actions.length} actions, ETA ≈ ${input.plan.etaMinutes} min.`
          : "No plan generated yet for the active emergency."
        : "Standing by for the next incident.",
      to: "/digital-twin",
    },
    {
      id: "resqr",
      name: "RESQR ID",
      description: "Token-only QR that reveals your emergency summary to responders.",
      state: input.hasResqr ? (input.contactCount > 0 ? "ready" : "attention") : "attention",
      detail: !input.hasResqr
        ? "No RESQR ID issued yet — open the module to generate one."
        : input.contactCount > 0
          ? "QR active with guardian details attached."
          : "QR active, but no emergency contact is saved for responders to call.",
      to: "/resqr-id",
    },
    {
      id: "accident",
      name: "AI Accident Response Engine",
      description: "Photo and video triage returning severity, hazards, first aid and hospitals.",
      state: input.lastAccidentReport ? "ready" : "idle",
      detail: input.lastAccidentReport
        ? `Last analysis: ${input.lastAccidentReport.ai_summary ?? input.lastAccidentReport.type} on ${new Date(
            input.lastAccidentReport.started_at,
          ).toLocaleDateString()}.`
        : "Capture or upload a scene to run an AI analysis.",
      to: "/report",
    },
  ];
}
