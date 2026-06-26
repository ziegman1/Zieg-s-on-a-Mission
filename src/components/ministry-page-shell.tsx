import type { ReactNode } from "react";
import { MINISTRY_PROSE_CLASS } from "@/lib/site-builder/formatted-content";
import { SiteBuilderFormattedContent } from "@/components/site-builder/site-builder-formatted-content";

export function MinistryPageShell({
  title,
  lede,
  children,
}: {
  title: string;
  lede?: string;
  children: ReactNode;
}) {
  const showHeader = title.trim().length > 0 || Boolean(lede?.trim());

  return (
    <article className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
      {showHeader ? (
        <header className="mb-10">
          {title.trim() ? (
            <h1 className="font-serif text-3xl sm:text-4xl text-brand-primary tracking-wide">
              {title}
            </h1>
          ) : null}
          {lede ? (
            <SiteBuilderFormattedContent
              text={lede}
              className="mt-4 text-lg text-brand-ink/85 max-w-2xl"
            />
          ) : null}
        </header>
      ) : null}
      <div className={MINISTRY_PROSE_CLASS}>
        {children}
      </div>
    </article>
  );
}
