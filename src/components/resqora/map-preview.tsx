import { motion } from "motion/react";
import { MapPin } from "lucide-react";
import { mapsEmbedUrl, type Coords } from "@/lib/alerts";

export function MapPreview({
  coords,
  title = "Live emergency location",
  className = "h-72 sm:h-96",
}: {
  coords: Coords | null;
  title?: string;
  className?: string;
}) {
  if (!coords) {
    return (
      <div
        className={`relative grid ${className} place-items-center bg-linear-to-br from-primary/10 via-background to-alert/10`}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] [background-size:44px_44px]"
        />
        <div className="relative grid place-items-center">
          <motion.span
            animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
            className="absolute size-24 rounded-full bg-alert/30"
          />
          <span className="relative grid size-12 place-items-center rounded-full bg-alert text-alert-foreground shadow-lg shadow-alert/40">
            <MapPin className="size-6" aria-hidden="true" />
          </span>
        </div>
        <p className="absolute bottom-4 rounded-full bg-background/80 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
          Waiting for GPS coordinates…
        </p>
      </div>
    );
  }

  return (
    <iframe
      title={title}
      src={mapsEmbedUrl(coords)}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className={`w-full border-0 ${className}`}
    />
  );
}
