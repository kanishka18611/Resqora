import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Bot, RotateCcw, Siren, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/system/page-header";
import { StatusIndicator } from "@/components/system/status-indicator";
import { Button } from "@/components/ui/button";
import {
  firstAidSteps,
  scoreToSeverity,
  severityMeta,
  severityPriority,
  suggestedServices,
  toSeverityScore,
  triageQuestions,
  type Severity,
} from "@/lib/triage";

export const Route = createFileRoute("/_app/assistant")({
  head: () => ({
    meta: [
      { title: "AI Emergency Assistant — RESQORA" },
      {
        name: "description",
        content:
          "Guided RESQORA triage: answer seven questions to get a 0–100 severity score and step-by-step first-aid instructions.",
      },
      { property: "og:title", content: "RESQORA AI Emergency Assistant" },
      {
        property: "og:description",
        content: "Severity triage and first-aid guidance in under a minute.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AssistantPage,
});

type Message = { id: string; role: "assistant" | "user"; text: string };

function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      role: "assistant",
      text: "I'm the RESQORA assistant. I'll ask seven quick questions to score severity from 0 to 100 and give you first-aid steps. If anyone is in immediate danger, trigger an SOS first.",
    },
    { id: "q0", role: "assistant", text: triageQuestions[0].prompt },
  ]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState(0);
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking, severity]);

  function answer(option: { label: string; weight: number }) {
    const question = triageQuestions[index];
    const nextAnswers = { ...answers, [question.id]: option.label };
    const nextScore = score + option.weight;
    setAnswers(nextAnswers);
    setScore(nextScore);
    setMessages((prev) => [...prev, { id: `${question.id}-a`, role: "user", text: option.label }]);

    const nextIndex = index + 1;
    setThinking(true);
    window.setTimeout(() => {
      setThinking(false);
      if (nextIndex < triageQuestions.length) {
        setMessages((prev) => [
          ...prev,
          { id: `q${nextIndex}`, role: "assistant", text: triageQuestions[nextIndex].prompt },
        ]);
        setIndex(nextIndex);
      } else {
        const normalised = toSeverityScore(nextScore);
        const finalSeverity = scoreToSeverity(normalised);
        setSeverity(finalSeverity);
        setMessages((prev) => [
          ...prev,
          {
            id: "verdict",
            role: "assistant",
            text: `Severity ${normalised}/100 — ${severityMeta[finalSeverity].label}. ${severityMeta[finalSeverity].summary}`,
          },
        ]);
        setIndex(nextIndex);
      }
    }, 650);
  }

  function reset() {
    setMessages([
      {
        id: "intro",
        role: "assistant",
        text: "Starting a new triage. Tell me what's happening.",
      },
      { id: "q0", role: "assistant", text: triageQuestions[0].prompt },
    ]);
    setIndex(0);
    setAnswers({});
    setScore(0);
    setSeverity(null);
  }

  const currentQuestion = index < triageQuestions.length ? triageQuestions[index] : null;
  const severityScore = toSeverityScore(score);
  const displaySeverity = severity ?? scoreToSeverity(severityScore);
  const meterTone: Record<Severity, string> = {
    low: "bg-safe",
    medium: "bg-primary",
    high: "bg-warning",
    critical: "bg-alert",
  };

  return (
    <>
      <PageHeader
        icon={Bot}
        title="AI emergency assistant"
        description="Guided triage that calculates severity and walks you through first aid."
        actions={
          severity ? (
            <StatusIndicator
              status={severityMeta[severity].status}
              label={severityMeta[severity].label}
            />
          ) : (
            <StatusIndicator status="active" label="Triage in progress" />
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="glass-panel flex min-h-[520px] flex-col rounded-3xl p-5">
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={message.role === "user" ? "flex justify-end" : "flex gap-3"}
                >
                  {message.role === "assistant" && (
                    <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Sparkles className="size-4" aria-hidden="true" />
                    </span>
                  )}
                  <p
                    className={
                      message.role === "user"
                        ? "max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                        : "max-w-[85%] rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 text-sm text-foreground"
                    }
                  >
                    {message.text}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
            {thinking && (
              <div className="flex gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="size-4" aria-hidden="true" />
                </span>
                <span className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3">
                  {[0, 1, 2].map((dot) => (
                    <motion.span
                      key={dot}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: dot * 0.15 }}
                      className="size-1.5 rounded-full bg-muted-foreground"
                    />
                  ))}
                </span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="mt-4 border-t border-border pt-4">
            {currentQuestion ? (
              <div className="flex flex-wrap gap-2">
                {currentQuestion.options.map((option) => (
                  <Button
                    key={option.label}
                    variant="outline"
                    disabled={thinking}
                    onClick={() => answer(option)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="emergency">
                  <Link to="/emergency">
                    <Siren className="size-4" />
                    Trigger SOS
                  </Link>
                </Button>
                <Button variant="outline" onClick={reset}>
                  <RotateCcw className="size-4" />
                  New triage
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-foreground">Severity assessment</h2>
            <p className="mt-3 font-display text-3xl font-semibold text-foreground">
              {severityScore}
              <span className="ml-1 text-base font-medium text-muted-foreground">/ 100</span>
            </p>
            <div
              className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={severityScore}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Severity score"
            >
              <motion.div
                animate={{ width: `${severityScore}%` }}
                transition={{ type: "spring", stiffness: 140, damping: 20 }}
                className={`h-full rounded-full ${meterTone[displaySeverity]}`}
              />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {severity
                ? severityMeta[severity].summary
                : `Question ${Math.min(index + 1, triageQuestions.length)} of ${triageQuestions.length}`}
            </p>
            {severity && (
              <dl className="mt-4 space-y-2 border-t border-border pt-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Priority</dt>
                  <dd className="text-right font-medium text-foreground">
                    {severityPriority[severity].priority}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Response</dt>
                  <dd className="text-right text-foreground">{severityPriority[severity].eta}</dd>
                </div>
              </dl>
            )}
          </div>

          {severity && (
            <div className="glass-panel rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-foreground">Recommended services</h2>
              <ul className="mt-3 space-y-2">
                {suggestedServices(answers, severity).map((service) => (
                  <li
                    key={service}
                    className="rounded-xl bg-muted px-3 py-2 text-sm text-foreground"
                  >
                    {service}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="mt-3 w-full">
                <Link to="/nearby">Find these nearby</Link>
              </Button>
            </div>
          )}

          <div className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-foreground">First-aid instructions</h2>
            {severity ? (
              <ol className="mt-3 space-y-3">
                {firstAidSteps(answers, severity).map((step, i) => (
                  <li key={step} className="flex gap-3 text-sm text-foreground">
                    <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-alert/10 text-xs font-semibold text-alert">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Answer the questions and tailored first-aid steps will appear here.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
