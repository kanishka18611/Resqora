import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  compact = false,
  tagline = "Emergency Response",
  size = "default",
}: {
  className?: string;
  compact?: boolean;
  tagline?: string;
  size?: "default" | "lg";
}) {
  const lg = size === "lg";
  return (
    <span className={cn("flex items-center gap-2.5 sm:gap-3", className)}>
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-2xl bg-linear-to-br from-alert to-primary text-primary-foreground shadow-md shadow-alert/25",
          lg ? "size-10 sm:size-11" : "size-9",
        )}
      >
        <ShieldCheck className={cn(lg ? "size-6" : "size-5")} aria-hidden="true" />
      </span>
      {!compact && (
        <span className="min-w-0">
          <span
            className={cn(
              "block font-display font-extrabold leading-none tracking-tight text-foreground",
              lg ? "text-xl sm:text-2xl" : "text-lg",
            )}
          >
            RESQORA
          </span>
          <span className="mt-1 block truncate text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-[10px]">
            {tagline}
          </span>
        </span>
      )}
    </span>
  );
}
