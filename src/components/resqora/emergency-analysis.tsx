import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Brain, Loader2, Mic, MicOff, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { logEvent, type Emergency } from "@/lib/api";
import { analyzeEmergencyDescription, type EmergencyAnalysis } from "@/lib/analysis.functions";
import { checkRateLimit, sanitizeMultiline } from "@/lib/security";
import { cn } from "@/lib/utils";

const SEVERITY_STYLE: Record<string, string> = {
  low: "bg-success/15 text-success",
  medium: "bg-warning/15 text-warning",
  high: "bg-alert/15 text-alert",
  critical: "bg-alert text-alert-foreground",
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function createRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    (
      window as unknown as {
        SpeechRecognition?: new () => SpeechRecognitionLike;
        webkitSpeechRecognition?: new () => SpeechRecognitionLike;
      }
    ).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
      .webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

/** "What happened?" — voice or text, analysed into type, severity and first aid. */
export function EmergencyAnalysisPanel({ emergency }: { emergency: Emergency }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState(emergency.notes ?? "");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const stored: EmergencyAnalysis | null = emergency.ai_summary
    ? {
        emergencyType: emergency.type as EmergencyAnalysis["emergencyType"],
        severity: (emergency.severity ?? "medium") as EmergencyAnalysis["severity"],
        confidence: 100,
        summary: emergency.ai_summary,
        recommendedResponse: emergency.ai_recommendation ?? "",
        firstAid: emergency.ai_first_aid ?? [],
      }
    : null;
  const [result, setResult] = useState<EmergencyAnalysis | null>(stored);

  useEffect(() => {
    setVoiceSupported(Boolean(createRecognition()));
    return () => recognitionRef.current?.stop();
  }, []);

  function toggleVoice() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = createRecognition();
    if (!recognition) {
      toast.error("Voice input isn't supported on this browser");
      return;
    }
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += `${event.results[i][0].transcript} `;
      }
      setText(transcript.trim());
    };
    recognition.onerror = () => {
      setListening(false);
      toast.error("Could not hear you — try typing instead");
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  async function analyze() {
    const description = sanitizeMultiline(text, 2000);
    if (description.length < 3) {
      toast.error("Describe what happened first");
      return;
    }
    const limit = checkRateLimit("report");
    if (!limit.allowed) {
      toast.error(limit.message);
      return;
    }
    recognitionRef.current?.stop();
    setBusy(true);
    try {
      const analysis = await analyzeEmergencyDescription({ data: { description } });
      setResult(analysis);
      await supabase
        .from("emergencies")
        .update({
          type: analysis.emergencyType,
          severity: analysis.severity,
          notes: description,
          ai_summary: analysis.summary,
          ai_recommendation: analysis.recommendedResponse,
          ai_first_aid: analysis.firstAid,
        })
        .eq("id", emergency.id);
      await logEvent(
        emergency.id,
        emergency.user_id,
        "AI analysis complete",
        `${analysis.emergencyType} · ${analysis.severity} severity — ${analysis.summary}`,
      );
      await queryClient.invalidateQueries({ queryKey: ["active-emergency", emergency.user_id] });
      await queryClient.invalidateQueries({ queryKey: ["emergency-events", emergency.id] });
      toast.success("Analysis complete");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Analysis failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-primary/12 text-primary">
          <Brain className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-foreground">What happened?</h2>
          <p className="text-xs text-muted-foreground">
            Speak or type — RESQORA scores severity and gives first-aid guidance while help is
            arranged.
          </p>
        </div>
      </div>

      <Textarea
        rows={3}
        className="rounded-xl"
        placeholder="A motorbike hit a car at the junction, the rider is bleeding from the leg."
        value={text}
        onChange={(event) => setText(event.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="hero" onClick={analyze} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          Analyse
        </Button>
        {voiceSupported && (
          <Button
            variant={listening ? "emergency" : "outline"}
            onClick={toggleVoice}
            aria-pressed={listening}
          >
            {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            {listening ? "Stop recording" : "Speak"}
          </Button>
        )}
      </div>

      {result && (
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full text-[10px] font-semibold uppercase">
              {result.emergencyType}
            </Badge>
            <Badge
              className={cn(
                "rounded-full text-[10px] font-semibold uppercase",
                SEVERITY_STYLE[result.severity],
              )}
            >
              {result.severity}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-foreground">{result.summary}</p>
          {result.recommendedResponse && (
            <p className="mt-1 text-xs text-muted-foreground">{result.recommendedResponse}</p>
          )}
          {result.firstAid.length > 0 && (
            <>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                First aid right now
              </p>
              <ol className="mt-2 space-y-1.5">
                {result.firstAid.map((step, index) => (
                  <li key={step} className="flex gap-2 text-sm text-foreground">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-alert/12 text-[11px] font-semibold text-alert">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      )}
    </div>
  );
}
