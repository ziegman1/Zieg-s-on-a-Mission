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

/** Inner column: content above, CTA pinned toward the bottom via flex. */
export function StorefrontIntroInner({
  children,
  cta,
  className,
}: {
  children: ReactNode;
  cta: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pt-6 pb-8 sm:pt-7 sm:pb-9 md:pt-8 md:pb-10",
        className,
      )}
    >
      <div className="flex flex-col">{children}</div>
      <div className="mt-6 flex justify-center md:mt-auto md:pt-8">{cta}</div>
    </div>
  );
}
