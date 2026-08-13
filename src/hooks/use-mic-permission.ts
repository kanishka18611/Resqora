import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Real microphone availability for RESQ AI.
 * Browsers cannot grant permission silently, so this hook only ever *reads* the
 * native permission state and verifies a real input device exists before it
 * reports the microphone as ready.
 */
export type MicState = "checking" | "unsupported" | "unavailable" | "prompt" | "granted" | "denied";

const DENIED_ERRORS = new Set(["NotAllowedError", "SecurityError", "PermissionDeniedError"]);
const MISSING_ERRORS = new Set(["NotFoundError", "DevicesNotFoundError", "OverconstrainedError"]);

function classify(error: unknown): { state: MicState; message: string } {
  const name = error instanceof DOMException ? error.name : "";
  if (DENIED_ERRORS.has(name))
    return {
      state: "denied",
      message:
        "Microphone access is blocked. Enable it for this site in your browser settings, then reload.",
    };
  if (MISSING_ERRORS.has(name))
    return { state: "unavailable", message: "No microphone was found on this device." };
  if (name === "NotReadableError" || name === "TrackStartError")
    return {
      state: "unavailable",
      message: "The microphone is in use by another app. Close it and try again.",
    };
  return {
    state: "prompt",
    message: "Could not start the microphone — please try again.",
  };
}

export function useMicPermission() {
  const [state, setState] = useState<MicState>("checking");
  const [error, setError] = useState<string | null>(null);
  const probing = useRef(false);

  const supported = useCallback(
    () => typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia),
    [],
  );

  /** Opens and immediately releases a stream — the only reliable readiness test. */
  const probe = useCallback(async (): Promise<MicState> => {
    if (!supported()) {
      setState("unsupported");
      return "unsupported";
    }
    if (probing.current) return state;
    probing.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setError(null);
      setState("granted");
      return "granted";
    } catch (err) {
      const { state: next, message } = classify(err);
      setError(message);
      setState(next);
      return next;
    } finally {
      probing.current = false;
    }
  }, [state, supported]);

  // Read the stored permission first: granted → initialise automatically, denied
  // → explain, prompt → wait for the user's tap. No repeated prompting.
  useEffect(() => {
    let alive = true;
    if (!supported()) {
      setState("unsupported");
      return;
    }
    let status: PermissionStatus | null = null;
    const onChange = () => {
      if (!alive || !status) return;
      if (status.state === "granted") void probe();
      else if (status.state === "denied") {
        setState("denied");
        setError(
          "Microphone access is blocked. Enable it for this site in your browser settings, then reload.",
        );
      } else {
        setState("prompt");
        setError(null);
      }
    };
    void (async () => {
      try {
        status = await navigator.permissions?.query({
          name: "microphone" as PermissionName,
        });
      } catch {
        status = null;
      }
      if (!alive) return;
      if (!status) {
        // Safari has no Permissions API for microphone — wait for a user tap.
        setState("prompt");
        return;
      }
      status.addEventListener("change", onChange);
      onChange();
    })();
    return () => {
      alive = false;
      status?.removeEventListener("change", onChange);
    };
  }, [probe, supported]);

  // A microphone can be unplugged mid-session.
  useEffect(() => {
    if (!supported() || !navigator.mediaDevices?.addEventListener) return;
    const onDeviceChange = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!devices.some((device) => device.kind === "audioinput")) {
          setState("unavailable");
          setError("The microphone was disconnected.");
        } else if (state === "unavailable") {
          void probe();
        }
      } catch {
        /* device listing is best-effort */
      }
    };
    navigator.mediaDevices.addEventListener("devicechange", onDeviceChange);
    return () => navigator.mediaDevices.removeEventListener("devicechange", onDeviceChange);
  }, [probe, state, supported]);

  /** Called from a user gesture: triggers the native prompt at most once per tap. */
  const request = useCallback(async () => {
    if (state === "denied" || state === "unsupported") return state;
    return probe();
  }, [probe, state]);

  return { state, error, request, refresh: probe, ready: state === "granted" };
}
