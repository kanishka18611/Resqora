import { useMemo, useState } from "react";
import { MessageSquare, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { languages, urgencyMeta, type MedAiConversation, type Urgency } from "@/lib/medai";

/** Saved consultations: continue, review or delete previous conversations. */
export function MedAiHistoryPanel({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onNew,
  onClearAll,
}: {
  conversations: MedAiConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onClearAll: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter((conversation) =>
      `${conversation.title} ${conversation.urgency ?? ""}`.toLowerCase().includes(term),
    );
  }, [conversations, query]);

  return (
    <aside className="glass-panel rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Consultation history</h2>
        <Button size="sm" variant="outline" className="h-9" onClick={onNew}>
          <Plus className="size-4" /> New
        </Button>
      </div>

      {conversations.length > 0 && (
        <div className="relative mt-3">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search previous chats"
            aria-label="Search previous consultations"
            className="h-10 rounded-xl pl-9"
          />
        </div>
      )}

      {conversations.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Your saved consultations will appear here. History is private to your account.
        </p>
      ) : filtered.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">No consultation matches “{query}”.</p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {filtered.map((conversation) => {
            const active = conversation.id === activeId;
            const urgency = (conversation.urgency as Urgency | null) ?? null;
            return (
              <li
                key={conversation.id}
                className={`flex items-center gap-1 rounded-xl border p-1 pl-2 transition ${
                  active
                    ? "border-primary/50 bg-primary/10"
                    : "border-transparent hover:bg-muted/50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  className="min-w-0 flex-1 py-1.5 text-left"
                >
                  <span className="flex items-center gap-1.5 truncate text-sm font-medium">
                    <MessageSquare
                      className="size-3.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    {conversation.title}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {urgency
                      ? `${urgencyMeta[urgency].emoji} ${urgencyMeta[urgency].label} · `
                      : ""}
                    {languages[(conversation.language as "en" | "hi" | "te") ?? "en"]?.nativeLabel}
                    {" · "}
                    {new Date(conversation.updated_at).toLocaleDateString()}
                  </span>
                </button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 shrink-0"
                  onClick={() => onDelete(conversation.id)}
                  aria-label={`Delete ${conversation.title}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {conversations.length > 0 && (
        <Button
          size="sm"
          variant="ghost"
          className="mt-3 w-full text-muted-foreground"
          onClick={onClearAll}
        >
          <Trash2 className="size-4" /> Delete all history
        </Button>
      )}
    </aside>
  );
}
