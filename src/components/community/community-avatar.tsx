import Image from "next/image";
import { cn } from "@/lib/utils";

export function CommunityAvatar({
  name,
  imageUrl,
  size = "md",
  className,
}: {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const sizeClass =
    size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-12 w-12 text-base" : "h-10 w-10 text-sm";

  if (imageUrl?.trim()) {
    return (
      <span
        className={cn(
          "relative inline-flex shrink-0 overflow-hidden rounded-full ring-2 ring-white/80 bg-brand-surface",
          sizeClass,
          className,
        )}
      >
        <Image
          src={imageUrl}
          alt=""
          fill
          className="object-cover"
          sizes={size === "sm" ? "32px" : size === "lg" ? "48px" : "40px"}
          unoptimized
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-brand-primary/25 font-semibold text-brand-ink ring-2 ring-white/80",
        sizeClass,
        className,
      )}
      aria-hidden
    >
      {initials || "?"}
    </span>
  );
}
