import { useMemo, useState } from "react";
import { MessageSquare, Plus, Search, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { languages, urgencyMeta, type MedAiConversation, type Urgency } from "@/lib/medai";

/** Recent chats: continue, search, favourite or delete a consultation. */
export function ResqChatHistory({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onToggleFavourite,
  onNew,
  onClearAll,
}: {
  conversations: MedAiConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleFavourite: (id: string, next: boolean) => void;
  onNew: () => void;
  onClearAll: () => void;
}) {
  const [query, setQuery] = useState("");
  const [favouritesOnly, setFavouritesOnly] = useState(false);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return conversations
      .filter((conversation) => (favouritesOnly ? conversation.is_favourite : true))
      .filter((conversation) =>
        term
          ? `${conversation.title} ${conversation.urgency ?? ""}`.toLowerCase().includes(term)
          : true,
      );
  }, [conversations, query, favouritesOnly]);

  return (
    <aside className="glass-panel rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Recent chats</h2>
        <Button size="sm" variant="outline" className="h-9 rounded-xl" onClick={onNew}>
          <Plus className="size-4" /> New chat
        </Button>
      </div>

      {conversations.length > 0 && (
        <>
          <div className="relative mt-3">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search chat history"
              aria-label="Search chat history"
              className="h-10 rounded-xl pl-9"
            />
          </div>
          <Button
            size="sm"
            variant={favouritesOnly ? "default" : "ghost"}
            className="mt-2 h-9 w-full rounded-xl"
            onClick={() => setFavouritesOnly((prev) => !prev)}
            aria-pressed={favouritesOnly}
          >
            <Star className="size-4" /> {favouritesOnly ? "Showing favourites" : "Favourites only"}
          </Button>
        </>
      )}

      {conversations.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Your chats are saved privately to your account and appear here.
        </p>
      ) : filtered.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">No chat matches that filter.</p>
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
                  onClick={() => onToggleFavourite(conversation.id, !conversation.is_favourite)}
                  aria-label={
                    conversation.is_favourite
                      ? `Remove ${conversation.title} from favourites`
                      : `Add ${conversation.title} to favourites`
                  }
                >
                  <Star
                    className={`size-4 ${conversation.is_favourite ? "fill-warning text-warning" : ""}`}
                  />
                </Button>
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
          <Trash2 className="size-4" /> Delete all chats
        </Button>
      )}
    </aside>
  );
}
