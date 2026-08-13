import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const originSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const fetchNearbyServices = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => originSchema.parse(data))
  .handler(async ({ data }) => {
    const { findNearbyServices } = await import("@/lib/nearby.server");
    return findNearbyServices(data, 3);
  });

export const geocodeAddress = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ query: z.string().min(2).max(160) }).parse(data))
  .handler(async ({ data }) => {
    const { geocodePlace } = await import("@/lib/nearby.server");
    return geocodePlace(data.query);
  });
