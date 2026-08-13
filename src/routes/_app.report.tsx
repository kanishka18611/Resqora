import { createFileRoute } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import { PageHeader } from "@/components/system/page-header";
import { AccidentResponseEngine } from "@/components/accident/accident-response-engine";

export const Route = createFileRoute("/_app/report")({
  head: () => ({
    meta: [
      { title: "Report an accident with AI analysis — RESQORA" },
      {
        name: "description",
        content:
          "Take or upload a photo or video of an accident and RESQORA analyses the emergency type, severity and confidence, then recommends who to alert.",
      },
      { property: "og:title", content: "Report an accident — RESQORA" },
      {
        property: "og:description",
        content:
          "AI photo and video triage for accidents, with one-tap contact and responder alerts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  return (
    <>
      <PageHeader
        icon={Camera}
        title="Report accident"
        description="Photo, 30-second clip or upload — RESQORA returns an AI-assisted medical report, guided first aid, specialist hospitals and one-tap emergency actions."
      />
      <AccidentResponseEngine />
    </>
  );
}
