import { languageList, type LanguageCode } from "@/lib/medai";

/** Instant language switch — the conversation continues in the new language. */
export function LanguageSelector({
  value,
  onChange,
}: {
  value: LanguageCode;
  onChange: (code: LanguageCode) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Assistant language"
      className="flex gap-1 rounded-2xl border border-border/60 bg-card/60 p-1"
    >
      {languageList.map((language) => {
        const active = language.code === value;
        return (
          <button
            key={language.code}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(language.code)}
            className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition ${
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/60"
            }`}
          >
            <span aria-hidden="true">{language.flag}</span> {language.nativeLabel}
          </button>
        );
      })}
    </div>
  );
}
