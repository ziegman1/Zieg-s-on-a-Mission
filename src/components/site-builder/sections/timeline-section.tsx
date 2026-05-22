import { contentStr, visibleListItems } from "@/lib/site-builder/content-utils";
import type { PageSection } from "@/lib/site-builder/types";

export function TimelineSection({ section }: { section: PageSection }) {
  const c = section.content;
  const headline = contentStr(c, "headline");
  const intro = contentStr(c, "intro");
  const items = visibleListItems(c.items);

  if (!headline.trim() && items.length === 0) return null;

  return (
    <section className="border-t border-brand-primary/15 px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl">
        {headline.trim() ? (
          <h2 className="font-serif text-2xl text-brand-primary tracking-wide text-center">{headline}</h2>
        ) : null}
        {intro.trim() ? (
          <p className="mt-3 text-center text-brand-ink/80 leading-relaxed">{intro}</p>
        ) : null}
        <ul className="mt-10 space-y-8">
          {items.map((item) => (
            <li key={item.id} className="border-l-2 border-brand-primary/30 pl-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary/80">
                {String(item.metadata?.when ?? "")}
              </p>
              <h3 className="mt-1 font-serif text-lg text-brand-ink">{item.text}</h3>
              <p className="mt-2 text-sm text-brand-ink/80 leading-relaxed">
                {String(item.metadata?.description ?? "")}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
