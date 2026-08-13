import avatarUrl from "@/assets/resq-ai-avatar.png";

/** RESQ AI identity mark, used in the header, bubbles and empty state. */
export function ResqAvatar({
  size = 40,
  className,
  pulse = false,
}: {
  size?: number;
  className?: string;
  pulse?: boolean;
}) {
  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center rounded-full bg-primary/10 ring-1 ring-primary/20 ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      {pulse && (
        <span
          className="absolute inset-0 animate-ping rounded-full bg-primary/20"
          aria-hidden="true"
        />
      )}
      <img
        src={avatarUrl}
        alt="RESQ AI"
        loading="lazy"
        width={816}
        height={816}
        className="relative size-[76%] object-contain"
      />
    </span>
  );
}
