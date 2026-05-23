import { contentStr } from "@/lib/site-builder/content-utils";
import type { PageSection } from "@/lib/site-builder/types";

/** Renders site-builder blog page header section (intro copy only). */
export function BlogIntroSection({ section }: { section: PageSection }) {
  const c = section.content;
  const headline = contentStr(c, "headline");
  const body = contentStr(c, "body");
  const sub = contentStr(c, "subheadline");
  const lede = body.trim() || sub.trim();

  if (!headline.trim() && !lede) return null;

  return (
    <header className="mb-10 sm:mb-12 max-w-2xl">
      {headline.trim() ? (
        <h1 className="font-serif text-3xl sm:text-4xl text-brand-primary tracking-wide">
          {headline}
        </h1>
      ) : null}
      {lede ? (
        <p className="mt-4 text-lg text-brand-ink/85 leading-relaxed whitespace-pre-wrap">{lede}</p>
      ) : null}
    </header>
  );
}
