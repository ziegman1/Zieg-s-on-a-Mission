import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { contentStr, visibleListItems } from "@/lib/site-builder/content-utils";
import type { PageSection } from "@/lib/site-builder/types";

export function CardGridSection({ section }: { section: PageSection }) {
  const c = section.content;
  const headline = contentStr(c, "headline");
  const intro = contentStr(c, "intro");
  const cards = visibleListItems(c.cards);

  if (!headline.trim() && cards.length === 0) return null;

  const isPartnerTiers = section.sectionKey === "tiers";

  if (isPartnerTiers) {
    return (
      <section className="border-t border-brand-primary/15 bg-white/45 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          {headline.trim() ? (
            <h2 className="text-center font-serif text-2xl text-brand-primary tracking-wide">{headline}</h2>
          ) : null}
          {intro.trim() ? (
            <p className="mx-auto mt-3 max-w-2xl text-center text-brand-ink/80 leading-relaxed">{intro}</p>
          ) : null}
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {cards.map((card) => (
              <Card key={card.id} className="border-brand-primary/20 bg-brand-surface/90 shadow-sm">
                <CardContent className="p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary/90">
                    {String(card.metadata?.amountLabel ?? "")}
                  </p>
                  <h3 className="mt-2 font-serif text-xl text-brand-ink tracking-wide">{card.text}</h3>
                  <p className="mt-3 text-sm text-brand-ink/85 leading-relaxed whitespace-pre-wrap">
                    {String(card.metadata?.body ?? "")}
                  </p>
                  {card.metadata?.giftNote ? (
                    <p className="mt-4 text-xs text-brand-ink/65 italic border-t border-brand-primary/15 pt-4">
                      {String(card.metadata.giftNote)}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-brand-surface px-4 py-12">
      <div className="max-w-5xl mx-auto">
        {headline.trim() ? <h2 className="font-serif text-xl text-brand-primary">{headline}</h2> : null}
        {intro.trim() ? <p className="mt-2 text-brand-ink/80">{intro}</p> : null}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <div key={card.id} className="rounded-xl bg-white/80 p-5 border border-black/[0.05]">
              <h3 className="font-medium text-brand-ink">{card.text}</h3>
              <p className="mt-2 text-sm text-brand-ink/75">{String(card.metadata?.body ?? "")}</p>
              {card.metadata?.href && card.metadata?.cta ? (
                <Link
                  href={String(card.metadata.href)}
                  className="mt-3 inline-block text-sm text-brand-primary font-medium"
                >
                  {String(card.metadata.cta)}
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
