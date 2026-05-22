import { contentStr } from "@/lib/site-builder/content-utils";
import type { PageSection } from "@/lib/site-builder/types";

export function QuoteSection({ section }: { section: PageSection }) {
  const quote = contentStr(section.content, "quote");
  const attr = contentStr(section.content, "attribution");
  if (!quote.trim()) return null;

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <blockquote className="rounded-xl border border-brand-primary/20 bg-white/60 p-6 text-brand-ink/90 italic leading-relaxed">
        {quote}
      </blockquote>
      {attr.trim() ? <p className="mt-3 text-sm font-medium text-brand-primary">{attr}</p> : null}
    </section>
  );
}
