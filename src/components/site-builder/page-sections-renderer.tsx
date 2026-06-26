"use client";

import type { PageSection } from "@/lib/site-builder/types";
import { CardGridSection } from "./sections/card-grid-section";
import { CtaSection } from "./sections/cta-section";
import { HeroSection } from "./sections/hero-section";
import { ImageTextSplitSection } from "./sections/image-text-split-section";
import { QuoteSection } from "./sections/quote-section";
import { TextSectionBlock } from "./sections/text-section";
import { TimelineSection } from "./sections/timeline-section";
import { FeaturedPostsSection } from "./sections/featured-posts-section";
import { MINISTRY_PROSE_CLASS } from "@/lib/site-builder/formatted-content";
import { partitionMinistrySections } from "@/lib/site-builder/ministry-sections-layout";
import { EditableSectionShell } from "./editable-element";
import { MinistryPageHeader } from "./ministry-page-header";
import { useBuilderPreview } from "./builder-preview-context";

export function PageSectionsRenderer({
  pageKey,
  sections,
  siteTagline = "",
  editMode = false,
}: {
  pageKey: string;
  sections: PageSection[];
  siteTagline?: string;
  editMode?: boolean;
}) {
  const ctx = useBuilderPreview();
  const inEditor = Boolean(editMode || ctx?.editMode);
  const toRender = inEditor ? sections : sections.filter((s) => s.visible);
  let splitIndex = 0;

  const wrap = (section: PageSection, node: React.ReactNode) => {
    if (!inEditor) return node;
    return (
      <EditableSectionShell
        key={section.id}
        sectionId={section.id}
        visible={section.visible}
        label={section.label}
      >
        {node}
      </EditableSectionShell>
    );
  };

  if (pageKey === "home") {
    return (
      <div>
        {toRender.map((section) => {
          if (!inEditor && !section.visible) return null;
          const inner = (() => {
            switch (section.sectionType) {
              case "hero":
                return <HeroSection section={section} useScriptTitle />;
              case "image_text_split": {
                const idx = splitIndex++;
                return <ImageTextSplitSection section={section} index={idx} />;
              }
              case "text_section":
                return <TextSectionBlock section={section} />;
              case "card_grid":
                return <CardGridSection section={section} />;
              case "cta":
                return <CtaSection section={section} siteTagline={siteTagline} />;
              default:
                return null;
            }
          })();
          return wrap(section, inner);
        })}
      </div>
    );
  }

  if (pageKey === "partner") {
    return (
      <div className="bg-brand-surface text-brand-ink">
        {toRender.map((section) => wrap(section, renderPartnerSection(section)))}
      </div>
    );
  }

  if (["about", "mission", "blog", "contact", "give", "merch"].includes(pageKey)) {
    return <MinistrySectionsPage sections={toRender} inEditor={inEditor} wrap={wrap} />;
  }

  return (
    <div>
      {toRender.map((section) =>
        wrap(section, renderGenericSection(section, siteTagline)),
      )}
    </div>
  );
}

function renderPartnerSection(section: PageSection) {
  switch (section.sectionType) {
    case "hero":
      return <HeroSection section={section} />;
    case "text_section":
      return <TextSectionBlock section={section} />;
    case "card_grid":
      return <CardGridSection section={section} />;
    case "timeline":
      return <TimelineSection section={section} />;
    case "quote":
      return <QuoteSection section={section} />;
    case "cta":
      return <CtaSection section={section} />;
    default:
      return null;
  }
}

function renderGenericSection(section: PageSection, siteTagline: string) {
  switch (section.sectionType) {
    case "hero":
      return <HeroSection section={section} />;
    case "text_section":
      return <TextSectionBlock section={section} />;
    case "cta":
      return <CtaSection section={section} siteTagline={siteTagline} />;
    case "quote":
      return <QuoteSection section={section} />;
    default:
      return null;
  }
}

function MinistrySectionsPage({
  sections,
  inEditor,
  wrap,
}: {
  sections: PageSection[];
  inEditor: boolean;
  wrap: (section: PageSection, node: React.ReactNode) => React.ReactNode;
}) {
  const { heroes, header, middle, footer } = partitionMinistrySections(sections);

  return (
    <>
      {heroes.map((section) => {
        const inner = <HeroSection section={section} />;
        return inner ? wrap(section, inner) : null;
      })}
      <article className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        {header ? wrap(header, <MinistryPageHeader section={header} />) : null}
        <div className={MINISTRY_PROSE_CLASS}>
          {middle.map((section) => {
            const inner = renderMinistrySection(section);
            return inner ? wrap(section, inner) : null;
          })}
        </div>
        {footer ? wrap(footer, <CtaSection section={footer} />) : null}
      </article>
    </>
  );
}

function renderMinistrySection(section: PageSection) {
  switch (section.sectionType) {
    case "hero":
      return <HeroSection section={section} />;
    case "text_section":
      return <TextSectionBlock section={section} />;
    case "quote":
      return <QuoteSection section={section} />;
    case "cta":
      return <CtaSection section={section} />;
    case "card_grid":
      return <CardGridSection section={section} />;
    case "timeline":
      return <TimelineSection section={section} />;
    case "featured_posts":
      return <FeaturedPostsSection section={section} />;
    case "image_text_split":
      return <ImageTextSplitSection section={section} index={0} />;
    default:
      return null;
  }
}
