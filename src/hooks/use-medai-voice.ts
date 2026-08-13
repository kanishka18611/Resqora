import { useCallback, useEffect, useRef, useState } from "react";
import { useMicPermission } from "@/hooks/use-mic-permission";

/**
 * Browser voice IO for RESQORA MedAI / RESQ AI: speech-to-text dictation and
 * spoken replies, both locale-aware (English, Hindi, Telugu). Recognition only
 * starts once a real microphone is confirmed available.
 */
type RecognitionEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
  resultIndex: number;
};

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

export function useMedAiVoice(locale: string) {
  const mic = useMicPermission();
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const recognitionRef = useRef<Recognition | null>(null);

  useEffect(() => {
    setSupported(recognitionCtor() !== null);
    setTtsSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const startListening = useCallback(async () => {
    const Ctor = recognitionCtor();
    if (!Ctor) {
      setError("Voice input is not supported in this browser — please type instead.");
      return;
    }
    // Confirm a working microphone before showing any listening state.
    const state = mic.state === "granted" ? "granted" : await mic.request();
    if (state !== "granted") {
      setError(mic.error ?? "Microphone access is required for voice input.");
      return;
    }
    setError(null);
    setTranscript("");
    const recognition = new Ctor();
    recognition.lang = locale;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i += 1) {
        text += event.results[i][0]?.transcript ?? "";
      }
      setTranscript(text);
    };
    recognition.onerror = (event) => {
      const code = event.error;
      setError(
        code === "not-allowed" || code === "service-not-allowed"
          ? "Microphone access is blocked. Allow it for this site in your browser settings."
          : code === "audio-capture"
            ? "No microphone was detected — check your device and try again."
            : code === "network"
              ? "Voice recognition needs a network connection — you can type instead."
              : code === "no-speech"
                ? "I didn’t catch that — tap voice and speak again."
                : "Voice input failed — please try again or type your symptoms.",
      );
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setError("Voice input could not start — please try again.");
      setListening(false);
    }
  }, [locale, mic]);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.slice(0, 800));
      utterance.lang = locale;
      utterance.rate = 0.98;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [locale],
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  useEffect(() => stopSpeaking, [stopSpeaking]);

  // Losing the microphone mid-session must stop the listening indicator.
  useEffect(() => {
    if (listening && mic.state !== "granted") stopListening();
  }, [listening, mic.state, stopListening]);

  return {
    listening,
    speaking,
    transcript,
    error: error ?? (mic.state === "denied" ? mic.error : null),
    supported,
    ttsSupported,
    micState: mic.state,
    micError: mic.error,
    micReady: mic.ready,
    requestMic: mic.request,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    clearTranscript: () => setTranscript(""),
  };
}
