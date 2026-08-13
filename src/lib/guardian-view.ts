import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Guardian command centre data layer. Everything is read through the
 * token-gated `get_guardian_view` RPC, so the Guardian never touches a table
 * directly and an expired link returns nothing at all.
 */
export type GuardianTrackPoint = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  battery_level: number | null;
  created_at: string;
};

export type GuardianNote = {
  id: string;
  note: string;
  guardian_name: string;
  created_at: string;
};

export type GuardianTask = {
  task_key: string;
  label: string;
  done: boolean;
  completed_by: string | null;
  completed_at: string | null;
};

export type GuardianContact = {
  name: string;
  relationship: string;
  phone: string;
  is_guardian: boolean;
};

export type GuardianView = {
  guardian_name: string;
  guardian_phone: string | null;
  guardian_email_on_file: boolean;
  full_name: string;
  avatar_url: string | null;
  user_phone: string | null;
  blood_group: string | null;
  age: number | null;
  allergies: string | null;
  medical_conditions: string | null;
  medications: string | null;
  preferred_hospital: string | null;
  preferred_language: string | null;
  emergency_id: string;
  reference: string;
  type: string;
  severity: string;
  status: string;
  live_status: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  notes: string | null;
  started_at: string;
  resolved_at: string | null;
  duration_seconds: number | null;
  location_updated_at: string | null;
  expires_at: string | null;
  ai_summary: string | null;
  ai_recommendation: string | null;
  ai_first_aid: string[];
  email_delivered: boolean;
  contacts: GuardianContact[];
  medical_notes: { title: string; category: string; content: string }[];
  guardian_notes: GuardianNote[];
  tasks: GuardianTask[];
  timeline: { label: string; detail: string | null; created_at: string }[];
  track: GuardianTrackPoint[];
};

/** The default Guardian mission checklist, ticked off live during the incident. */
export const GUARDIAN_MISSIONS: { key: string; label: string }[] = [
  { key: "contact_victim", label: "Contact the person in trouble" },
  { key: "call_ambulance", label: "Call an ambulance (108)" },
  { key: "navigate_hospital", label: "Navigate to the recommended hospital" },
  { key: "inform_family", label: "Inform the family" },
  { key: "carry_documents", label: "Carry medical documents / ID" },
  { key: "hand_over", label: "Hand over the emergency card to the doctor" },
];

export function guardianEnded(view: GuardianView) {
  return view.status === "resolved" || view.status === "cancelled" || view.live_status === "safe";
}

/** 5-second live refresh while the SOS runs; stops automatically once resolved. */
export const guardianViewQuery = (emergencyId: string, token: string) =>
  queryOptions({
    queryKey: ["guardian-view", emergencyId, token],
    refetchInterval: (query) => {
      const current = query.state.data as GuardianView | null | undefined;
      if (!current) return 5_000;
      return guardianEnded(current) ? 30_000 : 5_000;
    },
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_guardian_view", {
        _emergency_id: emergencyId,
        _token: token,
      });
      if (error) throw new Error(error.message);
      return (data as unknown as GuardianView | null) ?? null;
    },
  });

export async function addGuardianNote(input: { emergencyId: string; token: string; note: string }) {
  const { error } = await supabase.rpc("add_guardian_note", {
    _emergency_id: input.emergencyId,
    _token: input.token,
    _note: input.note,
  });
  if (error) throw new Error(error.message);
}

export async function setGuardianTask(input: {
  emergencyId: string;
  token: string;
  taskKey: string;
  label: string;
  done: boolean;
}) {
  const { error } = await supabase.rpc("set_guardian_task", {
    _emergency_id: input.emergencyId,
    _token: input.token,
    _task_key: input.taskKey,
    _label: input.label,
    _done: input.done,
  });
  if (error) throw new Error(error.message);
}

/** Merges saved task state onto the standard mission list. */
export function missionList(view: GuardianView): GuardianTask[] {
  return GUARDIAN_MISSIONS.map((mission) => {
    const saved = view.tasks.find((task) => task.task_key === mission.key);
    return (
      saved ?? {
        task_key: mission.key,
        label: mission.label,
        done: false,
        completed_by: null,
        completed_at: null,
      }
    );
  });
}

/** Human movement state derived from the last two real GPS pings. */
export function movementOf(track: GuardianTrackPoint[]) {
  const latest = track[0];
  if (!latest) return { label: "Awaiting GPS", speedKmh: null as number | null };
  const speedKmh = latest.speed != null ? Math.max(0, Math.round(latest.speed * 3.6)) : null;
  if (speedKmh == null) return { label: "Position held", speedKmh: null };
  if (speedKmh < 3) return { label: "Stationary", speedKmh };
  if (speedKmh < 15) return { label: "Moving on foot", speedKmh };
  return { label: "Moving in a vehicle", speedKmh };
}
