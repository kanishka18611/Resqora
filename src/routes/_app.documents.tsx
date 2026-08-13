import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, HeartPulse, NotebookPen } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/system/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { contactsQuery, emergenciesQuery, profileQuery } from "@/lib/api";
import { exportEmergencyHistoryPdf, exportMedicalProfilePdf } from "@/lib/export-pdf";

export const Route = createFileRoute("/_app/documents")({
  head: () => ({
    meta: [
      { title: "Emergency documents — RESQORA" },
      {
        name: "description",
        content:
          "Generate and download your emergency medical profile and incident history as responder-ready PDF documents.",
      },
      { property: "og:title", content: "Emergency documents — RESQORA" },
      {
        property: "og:description",
        content: "Responder-ready medical profile and incident history PDFs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DocumentsPage,
});

function DocumentsPage() {
  const { user } = useAuth();
  const profile = useQuery(profileQuery(user?.id));
  const contacts = useQuery(contactsQuery(user?.id));
  const emergencies = useQuery(emergenciesQuery(user?.id));

  const docs = [
    {
      icon: HeartPulse,
      title: "Emergency medical profile",
      description:
        "Blood group, allergies, conditions, medications, address and your trusted contacts on one printable page.",
      action: "Download PDF",
      run: () => {
        exportMedicalProfilePdf({
          profile: profile.data,
          contacts: contacts.data ?? [],
          notes: [],
        });
        toast.success("Medical profile PDF generated");
      },
    },
    {
      icon: FileText,
      title: "Emergency history report",
      description: `${emergencies.data?.length ?? 0} recorded incident${
        (emergencies.data?.length ?? 0) === 1 ? "" : "s"
      } with type, severity, status, duration and location.`,
      action: "Download PDF",
      run: () => {
        exportEmergencyHistoryPdf({
          profile: profile.data,
          emergencies: emergencies.data ?? [],
        });
        toast.success("Emergency history PDF generated");
      },
    },
  ];

  return (
    <>
      <PageHeader
        icon={FileText}
        title="Documents"
        description="Generate responder-ready documents from the data already stored on your RESQORA account."
        actions={
          <Button asChild variant="outline">
            <Link to="/notes">
              <NotebookPen className="size-4" aria-hidden="true" />
              Responder notes
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {docs.map((doc) => (
          <section key={doc.title} className="glass-panel flex flex-col rounded-2xl p-4">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <doc.icon className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-3 text-sm font-semibold text-foreground">{doc.title}</h2>
            <p className="mt-1 flex-1 text-xs text-muted-foreground">{doc.description}</p>
            <Button className="mt-3" variant="secondary" onClick={doc.run}>
              {doc.action}
            </Button>
          </section>
        ))}
      </div>
    </>
  );
}
