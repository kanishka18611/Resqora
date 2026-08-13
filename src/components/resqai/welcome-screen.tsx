import { Button } from "@/components/ui/button";
import { ResqAvatar } from "@/components/resqai/resq-avatar";
import { firstAidTopics, localisedTagline, quickQuestions } from "@/lib/resqai";
import { languages, type LanguageCode } from "@/lib/medai";

/** RESQ AI home: identity, greeting, suggestion chips and First Aid Mode. */
export function ResqWelcomeScreen({
  language,
  disabled,
  onAsk,
  onFirstAid,
}: {
  language: LanguageCode;
  disabled?: boolean;
  onAsk: (prompt: string) => void;
  onFirstAid: (topicId: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/60 bg-card/60 p-5 text-center">
        <ResqAvatar size={72} className="mx-auto" />
        <h2 className="mt-3 text-lg font-semibold">RESQ AI</h2>
        <p className="text-sm font-medium text-primary">{localisedTagline[language]}</p>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          {languages[language].greeting}
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Quick questions
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {quickQuestions.map((question) => (
            <Button
              key={question.id}
              size="sm"
              variant="outline"
              className="h-10 rounded-xl"
              disabled={disabled}
              onClick={() => onAsk(question.prompt)}
            >
              <span aria-hidden="true">{question.emoji}</span> {question.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          First aid mode — step-by-step guidance
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {firstAidTopics.map((topic) => (
            <Button
              key={topic.id}
              size="sm"
              variant="ghost"
              className="h-10 rounded-xl border border-border/50"
              onClick={() => onFirstAid(topic.id)}
            >
              <span aria-hidden="true">{topic.emoji}</span> {topic.title}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
