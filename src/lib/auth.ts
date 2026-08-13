import { supabase } from "@/integrations/supabase/client";

const REMEMBER_KEY = "aegis.remember-me";
const SESSION_KEY = "aegis.session-active";
const DEST_KEY = "aegis.post-auth-destination";

export function setRememberMe(remember: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
  sessionStorage.setItem(SESSION_KEY, "1");
}

export function shouldForceSignOut() {
  if (typeof window === "undefined") return false;
  const remembered = localStorage.getItem(REMEMBER_KEY) !== "0";
  const sameSession = sessionStorage.getItem(SESSION_KEY) === "1";
  return !remembered && !sameSession;
}

export function markSessionActive() {
  if (typeof window !== "undefined") sessionStorage.setItem(SESSION_KEY, "1");
}

export function storeDestination(path: string | undefined) {
  if (typeof window === "undefined") return;
  if (path && path.startsWith("/")) sessionStorage.setItem(DEST_KEY, path);
  else sessionStorage.removeItem(DEST_KEY);
}

export function takeDestination(): string | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(DEST_KEY);
  sessionStorage.removeItem(DEST_KEY);
  return value && value.startsWith("/") ? value : null;
}

/** Sends the user to onboarding until their safety profile is complete. */
export async function resolveDestination(userId: string, preferred?: string | null) {
  const { data } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", userId)
    .maybeSingle();
  if (!data?.onboarding_completed) return "/onboarding";
  return preferred && preferred.startsWith("/") && preferred !== "/auth" ? preferred : "/dashboard";
}
