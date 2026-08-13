import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { NotebookPen, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/system/page-header";
import { EmptyState } from "@/components/system/empty-state";
import { PanelSkeleton } from "@/components/system/loading-skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { NOTE_CATEGORIES, notesQuery } from "@/lib/resqora-data";
import { logActivity } from "@/lib/activity";

export const Route = createFileRoute("/_app/notes")({
  head: () => ({
    meta: [
      { title: "Emergency notes — RESQORA" },
      {
        name: "description",
        content:
          "Store key location, medical instructions, doctor and insurance details so responders find them on your RESQORA emergency profile.",
      },
      { property: "og:title", content: "RESQORA Emergency Notes" },
      {
        property: "og:description",
        content: "Critical instructions responders can read during an emergency.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const notes = useQuery(notesQuery(user?.id));
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(NOTE_CATEGORIES[0].value);
  const [content, setContent] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !content.trim()) throw new Error("Add a title and details first");
      const { error } = await supabase.from("emergency_notes").insert({
        user_id: user!.id,
        title: title.trim(),
        category,
        content: content.trim(),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      setTitle("");
      setContent("");
      toast.success("Note saved to your emergency profile");
      await logActivity(user?.id, "Profile updated", "Emergency note added");
      await queryClient.invalidateQueries({ queryKey: ["emergency-notes", user?.id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function remove(id: string) {
    const { error } = await supabase.from("emergency_notes").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Note deleted");
    await queryClient.invalidateQueries({ queryKey: ["emergency-notes", user?.id] });
  }

  return (
    <>
      <PageHeader
        icon={NotebookPen}
        title="Emergency notes"
        description="Everything a responder should know — key location, medication routine, doctor and insurance details."
      />

      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="glass-panel space-y-4 rounded-3xl p-5">
          <h2 className="text-sm font-semibold text-foreground">Add a note</h2>
          <div className="space-y-2">
            <Label htmlFor="note-title">Title</Label>
            <Input
              id="note-title"
              value={title}
              placeholder="Spare house key"
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="note-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTE_CATEGORIES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note-content">Details</Label>
            <Textarea
              id="note-content"
              rows={4}
              value={content}
              placeholder="Under the second flowerpot on the balcony."
              onChange={(event) => setContent(event.target.value)}
            />
          </div>
          <Button
            variant="hero"
            className="w-full"
            disabled={create.isPending || !user}
            onClick={() => create.mutate()}
          >
            <Plus className="size-4" />
            Save note
          </Button>
        </div>

        <div className="glass-panel rounded-3xl p-5">
          <h2 className="text-sm font-semibold text-foreground">Saved notes</h2>
          {notes.isLoading ? (
            <div className="mt-4">
              <PanelSkeleton rows={3} />
            </div>
          ) : (notes.data ?? []).length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={NotebookPen}
                title="No notes yet"
                description="Add the details a stranger would need to help you fast."
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {(notes.data ?? []).map((note, index) => (
                <motion.li
                  key={note.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="rounded-2xl border border-border bg-card/60 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{note.title}</p>
                      <Badge
                        variant="secondary"
                        className="mt-1 rounded-full text-[10px] capitalize"
                      >
                        {NOTE_CATEGORIES.find((c) => c.value === note.category)?.label ??
                          note.category}
                      </Badge>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Delete note ${note.title}`}
                      onClick={() => remove(note.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                    {note.content}
                  </p>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
