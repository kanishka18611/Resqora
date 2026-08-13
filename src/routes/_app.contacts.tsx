import { createFileRoute, Link } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/system/page-header";
import { Button } from "@/components/ui/button";
import { EmergencyContactsCard } from "@/components/landing/emergency-contacts-card";

export const Route = createFileRoute("/_app/contacts")({
  head: () => ({
    meta: [
      { title: "Emergency contacts — RESQORA" },
      {
        name: "description",
        content:
          "The trusted contacts RESQORA alerts the moment you trigger an SOS, with one-tap calling and live delivery status.",
      },
      { property: "og:title", content: "Emergency contacts — RESQORA" },
      { property: "og:description", content: "Trusted contacts alerted on every SOS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContactsPage,
});

function ContactsPage() {
  return (
    <>
      <PageHeader
        icon={Users}
        title="Emergency contacts"
        description="These three people are alerted automatically with your address and live tracking link whenever you trigger an SOS."
        actions={
          <Button asChild variant="outline">
            <Link to="/profile">Manage contacts</Link>
          </Button>
        }
      />
      <EmergencyContactsCard />
    </>
  );
}
