import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { IdCard } from "lucide-react";
import { PageHeader } from "@/components/system/page-header";
import { Button } from "@/components/ui/button";
import { MedicalIdCard } from "@/components/resqora/medical-id-card";
import { useAuth } from "@/hooks/use-auth";
import { contactsQuery, profileQuery } from "@/lib/api";

export const Route = createFileRoute("/_app/medical-id")({
  head: () => ({
    meta: [
      { title: "Medical ID for responders — RESQORA" },
      {
        name: "description",
        content:
          "One-tap medical ID with blood group, allergies, conditions, medications and trusted contacts, plus a responder QR code.",
      },
      { property: "og:title", content: "Medical ID — RESQORA" },
      {
        property: "og:description",
        content: "Blood group, allergies, conditions and contacts in one tap.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MedicalIdPage,
});

function MedicalIdPage() {
  const { user } = useAuth();
  const profile = useQuery(profileQuery(user?.id));
  const contacts = useQuery(contactsQuery(user?.id));

  return (
    <>
      <PageHeader
        icon={IdCard}
        title="Medical ID"
        description="Show this to any responder — it carries your blood group, allergies, conditions, medications and trusted contacts."
        actions={
          <Button asChild variant="outline">
            <Link to="/profile">Edit details</Link>
          </Button>
        }
      />
      <MedicalIdCard profile={profile.data} contacts={contacts.data ?? []} showQr />
    </>
  );
}
