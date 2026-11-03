import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Full-viewport introductory band beneath the sticky storefront header.
 * Desktop: min-height fills remaining viewport so the next section starts below the fold.
 * Mobile: grows with content (no forced height) to avoid clipping.
 */
export function StorefrontIntroViewport({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col border-b border-brand-primary/15",
        "md:min-h-[calc(100svh-var(--storefront-header-height,5rem))]",
        className,
      )}
    >
      {children}
    </section>
  );
}

/**
 * Inner column for intro CTAs.
 * - `bottom` (default): CTA sits near the bottom of the viewport (Ministry Funding).
 * - `follow`: CTA stays visually connected under the content; leftover viewport space
 *   remains beneath the button so the next section stays below the fold (Our Mission).
 */
export function StorefrontIntroInner({
  children,
  cta,
  className,
  ctaPlacement = "bottom",
}: {
  children: ReactNode;
  cta: ReactNode;
  className?: string;
  ctaPlacement?: "bottom" | "follow";
}) {
  const follow = ctaPlacement === "follow";

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pt-6 pb-8 sm:pt-7 sm:pb-9 md:pt-8 md:pb-10",
        className,
      )}
    >
      <div className="flex flex-col">{children}</div>
      <div
        className={cn(
          "flex justify-center",
          follow
            ? "mt-14 sm:mt-16"
            : "mt-6 md:mt-auto md:pt-8",
        )}
      >
        {cta}
      </div>
      {follow ? <div className="hidden md:block flex-1 min-h-10" aria-hidden /> : null}
    </div>
  );
}
