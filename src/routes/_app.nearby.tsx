import { createFileRoute } from "@tanstack/react-router";
import { MapPinned } from "lucide-react";
import { PageHeader } from "@/components/system/page-header";
import { NearestServices } from "@/components/resqora/nearest-services";
import { useLivePosition } from "@/hooks/use-live-position";
import { useNearbyServices } from "@/hooks/use-nearby-services";
import type { PlaceCategory } from "@/lib/nearby.server";

export const Route = createFileRoute("/_app/nearby")({
  validateSearch: (search: Record<string, unknown>): { category?: string } =>
    typeof search.category === "string" ? { category: search.category } : {},
  head: () => ({
    meta: [
      { title: "Nearby emergency services — RESQORA" },
      {
        name: "description",
        content:
          "Live hospitals, police stations, fire & rescue and blood banks around your GPS location with distance, ETA, call and navigation links.",
      },
      { property: "og:title", content: "Nearby emergency services — RESQORA" },
      {
        property: "og:description",
        content: "Real hospitals, police, fire and blood banks around you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NearbyPage,
});

const ALL: PlaceCategory[] = ["hospital", "ambulance", "police", "fire", "blood_bank"];

function NearbyPage() {
  const search = Route.useSearch();
  const { position } = useLivePosition();
  const nearby = useNearbyServices(position);
  const categories = ALL.includes(search.category as PlaceCategory)
    ? [search.category as PlaceCategory]
    : ALL;

  return (
    <>
      <PageHeader
        icon={MapPinned}
        title="Nearby services"
        description="Live results from the mapping service, sorted by distance from your current location."
      />
      <NearestServices position={position} nearby={nearby} categories={categories} />
    </>
  );
}
