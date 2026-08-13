import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Activity, Download, FileText, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/system/page-header";
import { EmptyState } from "@/components/system/empty-state";
import { PanelSkeleton } from "@/components/system/loading-skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { activityQuery } from "@/lib/activity";
import { contactsQuery, emergenciesQuery, profileQuery } from "@/lib/api";
import { notesQuery } from "@/lib/resqora-data";
import { exportEmergencyHistoryPdf, exportMedicalProfilePdf } from "@/lib/export-pdf";
import { formatRelativeTime } from "@/utils/format";

export const Route = createFileRoute("/_app/activity")({
  head: () => ({
    meta: [
      { title: "Activity log & exports — RESQORA" },
      {
        name: "description",
        content:
          "Review every RESQORA action — sign-ins, SOS activations, location sharing and profile edits — and export your records as PDF.",
      },
      { property: "og:title", content: "RESQORA Activity Log" },
      {
        property: "og:description",
        content: "A chronological audit trail of your safety account, with PDF exports.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ActivityPage,
});

function ActivityPage() {
  const { user } = useAuth();
  const logs = useQuery(activityQuery(user?.id));
  const profile = useQuery(profileQuery(user?.id));
  const contacts = useQuery(contactsQuery(user?.id));
  const notes = useQuery(notesQuery(user?.id));
  const emergencies = useQuery(emergenciesQuery(user?.id));
  const [term, setTerm] = useState("");

  const filtered = useMemo(() => {
    const needle = term.trim().toLowerCase();
    const rows = logs.data ?? [];
    if (!needle) return rows;
    return rows.filter((row) =>
      `${row.action} ${row.detail ?? ""} ${new Date(row.created_at).toLocaleString()}`
        .toLowerCase()
        .includes(needle),
    );
  }, [logs.data, term]);

  return (
    <>
      <PageHeader
        icon={Activity}
        title="Activity & exports"
        description="A chronological record of everything that happened on your RESQORA account."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                exportMedicalProfilePdf({
                  profile: profile.data,
                  contacts: contacts.data ?? [],
                  notes: notes.data ?? [],
                });
                toast.success("Medical profile PDF downloaded");
              }}
            >
              <FileText className="size-4" />
              Medical profile PDF
            </Button>
            <Button
              variant="hero"
              onClick={() => {
                exportEmergencyHistoryPdf({
                  profile: profile.data,
                  emergencies: emergencies.data ?? [],
                });
                toast.success("Emergency history PDF downloaded");
              }}
            >
              <Download className="size-4" />
              History PDF
            </Button>
          </div>
        }
      />

      <div className="glass-panel rounded-3xl p-5">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            aria-label="Search activity"
            placeholder="Search activity"
            className="pl-9"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
          />
        </div>

        {logs.isLoading ? (
          <div className="mt-4">
            <PanelSkeleton rows={4} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={Activity}
              title="No activity recorded"
              description="Sign-ins, SOS activations, sharing and profile updates appear here."
            />
          </div>
        ) : (
          <ol className="mt-5 space-y-4">
            {filtered.map((log, index) => (
              <motion.li
                key={log.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(index, 12) * 0.03 }}
                className="flex gap-3"
              >
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{log.action}</p>
                  {log.detail && <p className="text-xs text-muted-foreground">{log.detail}</p>}
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()} ·{" "}
                    {formatRelativeTime(new Date(log.created_at))}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}
