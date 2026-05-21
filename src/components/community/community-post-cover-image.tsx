import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type CommunityPostCoverImageProps = {
  src: string;
  alt?: string;
  /** Feed: full-width immersive. Composer: centered portrait card. */
  variant?: "feed" | "composer";
  className?: string;
  /** Overlay controls (e.g. remove button in composer) */
  children?: ReactNode;
};

const imageBaseClass = "block object-contain";

const variantStyles = {
  feed: {
    wrapper: "relative w-full rounded-xl overflow-hidden border border-brand-primary/10 bg-brand-surface",
    image: cn(imageBaseClass, "w-full h-auto max-h-[min(85vh,42rem)] max-w-full"),
    sizes: "(max-width: 34rem) 100vw, 34rem",
  },
  composer: {
    wrapper:
      "relative inline-block max-w-[min(100%,280px)] sm:max-w-[320px] rounded-xl overflow-hidden border border-brand-primary/10 bg-brand-surface",
    image: cn(imageBaseClass, "w-auto h-auto max-w-full max-h-[420px]"),
    sizes: "(max-width: 320px) 100vw, 320px",
  },
} as const;

/**
 * Post cover image — natural aspect ratio, no crop or landscape forcing.
 * Composer: centered portrait card. Feed: full card width.
 */
export function CommunityPostCoverImage({
  src,
  alt = "",
  variant = "feed",
  className,
  children,
}: CommunityPostCoverImageProps) {
  const styles = variantStyles[variant];

  const content = (
    <div className={cn(styles.wrapper, className)}>
      <Image
        src={src}
        alt={alt}
        width={0}
        height={0}
        sizes={styles.sizes}
        className={styles.image}
        unoptimized
        loading="lazy"
      />
      {children}
    </div>
  );

  if (variant === "composer") {
    return <div className="flex w-full justify-center">{content}</div>;
  }

  return content;
}
