"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { contentStr, sortedListItems, visibleListItems } from "@/lib/site-builder/content-utils";
import { getFieldStyle } from "@/lib/site-builder/content-utils";
import { elementStyleProps, isElementVisible } from "@/lib/site-builder/element-style-utils";
import type { PageSection } from "@/lib/site-builder/types";
import { EditableElement } from "../editable-element";
import { ContentElementsBlock } from "../content-elements-block";
import { SiteBuilderFormattedContent } from "../site-builder-formatted-content";
import { useBuilderPreview } from "../builder-preview-context";
import { cn } from "@/lib/utils";

export function CardGridSection({ section }: { section: PageSection }) {
  const ctx = useBuilderPreview();
  const c = section.content;
  const headline = contentStr(c, "headline");
  const intro = contentStr(c, "intro");
  const cardsRaw = sortedListItems(c.cards, { includeHidden: true });
  const cards = visibleListItems(c.cards);

  if (!ctx?.editMode && !headline.trim() && cards.length === 0) return null;

  const isPartnerTiers = section.sectionKey === "tiers";
  const isWaysToGetInvolved = section.sectionKey === "ways-to-get-involved";
  const isAdvocacyResources = section.sectionKey === "advocacy-team-resources";

  const headlineEl = headline.trim() ? (
    <EditableElement
      sectionId={section.id}
      elementId="headline"
      style={getFieldStyle(c, "headline")}
      visible={isElementVisible(getFieldStyle(c, "headline"), true)}
    >
      <SiteBuilderFormattedContent
        text={headline}
        className={cn(
          "font-serif text-2xl text-brand-primary tracking-wide",
          isPartnerTiers && "text-center",
        )}
      />
    </EditableElement>
  ) : ctx?.editMode ? (
    <EditableElement sectionId={section.id} elementId="headline" visible>
      <h2 className="text-zinc-400 italic text-sm">Headline (empty)</h2>
    </EditableElement>
  ) : null;

  const introEl = intro.trim() ? (
    <EditableElement
      sectionId={section.id}
      elementId="intro"
      style={getFieldStyle(c, "intro")}
    >
      <SiteBuilderFormattedContent
        text={intro}
        className={cn(
          "text-brand-ink/80",
          isPartnerTiers && "mx-auto mt-3 max-w-2xl text-center",
          !isPartnerTiers && "mt-2",
        )}
      />
    </EditableElement>
  ) : null;

  const cardNodes = (ctx?.editMode ? cardsRaw : cards).map((card) => {
    if (
      !ctx?.editMode &&
      (!card.visible || !isElementVisible(card.style, true))
    ) {
      return null;
    }

    const { className: cardCls, style: cardStyle } = elementStyleProps(card.style);

    const inner = isPartnerTiers ? (
      <Card className={cn("border-brand-primary/20 bg-brand-surface/90 shadow-sm h-full", cardCls)} style={cardStyle}>
        <CardContent className="p-6 sm:p-8">
          {card.metadata?.amountLabel ? (
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary/90">
              {String(card.metadata.amountLabel)}
            </p>
          ) : null}
          <SiteBuilderFormattedContent
            text={card.text}
            className="mt-2 font-serif text-xl text-brand-ink tracking-wide"
          />
          <SiteBuilderFormattedContent
            text={String(card.metadata?.body ?? "")}
            className="mt-3 text-sm text-brand-ink/85"
          />
          {card.metadata?.giftNote ? (
            <SiteBuilderFormattedContent
              text={String(card.metadata.giftNote)}
              className="mt-4 text-xs text-brand-ink/65 italic border-t border-brand-primary/15 pt-4"
            />
          ) : null}
        </CardContent>
      </Card>
    ) : (
      <div
        className={cn("rounded-xl bg-white/80 p-5 border border-black/[0.05] h-full", cardCls)}
        style={cardStyle}
      >
        <SiteBuilderFormattedContent text={card.text} className="font-medium text-brand-ink" />
        <SiteBuilderFormattedContent
          text={String(card.metadata?.body ?? "")}
          className="mt-2 text-sm text-brand-ink/75"
        />
        {card.metadata?.href && card.metadata?.cta ? (
          <Link
            href={String(card.metadata.href)}
            className="mt-3 inline-block text-sm text-brand-primary font-medium"
          >
            {String(card.metadata.cta)}
          </Link>
        ) : null}
      </div>
    );

    return (
      <EditableElement
        key={card.id}
        sectionId={section.id}
        elementId={`card:${card.id}`}
        style={card.style}
        visible={card.visible}
        layout="fill"
        styleOnWrapper={false}
        className={cn(!card.visible && ctx?.editMode && "opacity-50")}
      >
        {inner}
      </EditableElement>
    );
  });

  if (isPartnerTiers || isWaysToGetInvolved) {
    return (
      <section
        id={isWaysToGetInvolved ? "ways-to-get-involved" : undefined}
        className="border-t border-brand-primary/15 bg-white/45 px-4 py-16 sm:py-20"
      >
        <div className="mx-auto max-w-5xl">
          {headlineEl}
          {introEl}
          <div className="mt-12 grid gap-6 sm:grid-cols-2">{cardNodes}</div>
          <ContentElementsBlock section={section} />
        </div>
      </section>
    );
  }

  if (isAdvocacyResources) {
    return (
      <section
        id="advocacy-team-resources"
        className="border-t border-brand-primary/15 bg-gradient-to-b from-brand-surface to-white/40 px-4 py-16 sm:py-20 scroll-mt-20"
      >
        <div className="mx-auto max-w-5xl">
          {headlineEl}
          {introEl}
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cardNodes}</div>
          <ContentElementsBlock section={section} />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-brand-surface px-4 py-12">
      <div className="max-w-5xl mx-auto">
        {headlineEl}
        {introEl}
        <div className="mt-8 grid gap-6 md:grid-cols-3">{cardNodes}</div>
        <ContentElementsBlock section={section} />
      </div>
    </section>
  );
}
