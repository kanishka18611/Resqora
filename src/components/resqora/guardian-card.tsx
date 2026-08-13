import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { contactsQuery } from "@/lib/api";
import { guardianOf, setGuardian } from "@/lib/guardian";
import { logActivity } from "@/lib/activity";
import { logSecurityEvent } from "@/lib/audit";
import { cn } from "@/lib/utils";

/**
 * Guardian Mode: exactly one of the three trusted contacts can hold the
 * Guardian badge and receive the secure Guardian dashboard link during an SOS.
 */
export function GuardianCard({ userId }: { userId: string | undefined }) {
  const queryClient = useQueryClient();
  const contacts = useQuery(contactsQuery(userId));
  const [saving, setSaving] = useState<string | null>(null);
  const guardian = guardianOf(contacts.data);

  const choose = async (contactId: string | null) => {
    if (!userId) return;
    setSaving(contactId ?? "none");
    try {
      await setGuardian(userId, contactId);
      await queryClient.invalidateQueries({ queryKey: ["contacts", userId] });
      await logActivity(
        userId,
        "Guardian updated",
        contactId ? "Guardian assigned" : "Guardian cleared",
      );
      void logSecurityEvent(
        "Guardian changed",
        contactId ? "Guardian assigned to a trusted contact" : "Guardian cleared",
      );
      toast.success(contactId ? "Guardian updated" : "Guardian removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the Guardian");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 font-display text-base font-bold">
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            Guardian
          </p>
          <p className="text-xs text-muted-foreground">
            Your Guardian gets a private emergency command dashboard the moment you trigger SOS.
          </p>
        </div>
        {guardian && (
          <Badge className="rounded-full bg-primary/15 text-primary">Guardian set</Badge>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {(contacts.data ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">
            Add your trusted contacts first, then pick one as your Guardian.
          </p>
        )}
        {(contacts.data ?? []).map((contact) => {
          const active = contact.is_guardian;
          return (
            <button
              key={contact.id}
              type="button"
              onClick={() => choose(active ? null : contact.id)}
              disabled={saving !== null}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition",
                active ? "border-primary bg-primary/10" : "hover:bg-muted/60",
              )}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  {contact.name}
                  {active && (
                    <Badge className="ml-2 rounded-full bg-primary text-primary-foreground">
                      🛡 Guardian
                    </Badge>
                  )}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {contact.relationship} · {contact.phone}
                  {contact.email ? ` · ${contact.email}` : " · no email yet"}
                </span>
              </span>
              {saving === contact.id ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : active ? (
                <ShieldOff className="size-4 text-muted-foreground" aria-hidden="true" />
              ) : (
                <ShieldCheck className="size-4 text-muted-foreground" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
      {guardian && !guardian.email?.includes("@") && (
        <p className="mt-3 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-700">
          Add an email address for {guardian.name} so the Guardian alert can be delivered
          automatically.
        </p>
      )}
    </div>
  );
}
