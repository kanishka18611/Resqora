import { useState } from "react";
import { NotebookPen, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addGuardianNote, type GuardianView } from "@/lib/guardian-view";

const QUICK = [
  "Reached hospital",
  "Patient conscious",
  "Doctor contacted",
  "Police arrived",
  "Family arrived",
];

/** Guardian notes — timestamped, attributed and stored on the incident record. */
export function GuardianNotes({
  view,
  emergencyId,
  token,
  onSaved,
}: {
  view: GuardianView;
  emergencyId: string;
  token: string;
  onSaved: () => void;
}) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (note: string) => {
    const value = note.trim();
    if (!value) return;
    setSaving(true);
    try {
      await addGuardianNote({ emergencyId, token, note: value });
      setText("");
      onSaved();
      toast.success("Note added to the emergency record");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="glass-panel rounded-3xl p-4">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold">
        <NotebookPen className="size-5 text-primary" aria-hidden="true" />
        Guardian notes
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK.map((quick) => (
          <Button
            key={quick}
            size="sm"
            variant="outline"
            disabled={saving}
            onClick={() => submit(quick)}
          >
            {quick}
          </Button>
        ))}
      </div>
      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={500}
        rows={3}
        placeholder="Add what is happening on the ground…"
        className="mt-3 rounded-2xl"
      />
      <Button
        variant="hero"
        className="mt-2"
        disabled={saving || text.trim().length === 0}
        onClick={() => submit(text)}
      >
        <Send className="size-4" />
        Add note
      </Button>

      <ul className="mt-4 space-y-2">
        {view.guardian_notes.length === 0 && (
          <li className="text-sm text-muted-foreground">No Guardian notes yet.</li>
        )}
        {view.guardian_notes.map((note) => (
          <li key={note.id} className="rounded-2xl bg-card/70 p-3">
            <p className="text-sm">{note.note}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {note.guardian_name} · {new Date(note.created_at).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
