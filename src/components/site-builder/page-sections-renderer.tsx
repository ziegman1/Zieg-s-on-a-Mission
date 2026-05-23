"use client";

import { Fragment } from "react";
import { MinistryPageShell } from "@/components/ministry-page-shell";
import type { PageSection } from "@/lib/site-builder/types";
import { CardGridSection } from "./sections/card-grid-section";
import { CtaSection } from "./sections/cta-section";
import { HeroSection } from "./sections/hero-section";
import { ImageTextSplitSection } from "./sections/image-text-split-section";
import { QuoteSection } from "./sections/quote-section";
import { TextSectionBlock } from "./sections/text-section";
import { TimelineSection } from "./sections/timeline-section";
import { FeaturedPostsSection } from "./sections/featured-posts-section";
import { contentStr } from "@/lib/site-builder/content-utils";
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
    return <MinistrySectionsPage pageKey={pageKey} sections={toRender} inEditor={inEditor} wrap={wrap} />;
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

const MINISTRY_PROSE_CLASS =
  "prose prose-slate max-w-none text-brand-ink/90 space-y-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-brand-ink [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:tracking-tight [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_a]:text-brand-primary [&_a]:font-medium [&_a]:no-underline hover:[&_a]:underline";

function MinistrySectionsPage({
  pageKey,
  sections,
  inEditor,
  wrap,
}: {
  pageKey: string;
  sections: PageSection[];
  inEditor: boolean;
  wrap: (section: PageSection, node: React.ReactNode) => React.ReactNode;
}) {
  const header = sections.find((s) => s.sectionKey === "header");
  const footer = sections.find((s) => s.sectionKey === "footer-nav");
  const middle = sections.filter(
    (s) => s.sectionKey !== "header" && s.sectionKey !== "footer-nav",
  );

  const title = header ? contentStr(header.content, "headline") : "";
  const lede = header
    ? contentStr(header.content, "body") || contentStr(header.content, "subheadline")
    : "";

  if (inEditor) {
    return (
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
    );
  }

  return (
    <MinistryPageShell title={title || pageKey} lede={lede}>
      {middle.map((section) => {
        const inner = renderMinistrySection(section);
        return inner ? <Fragment key={section.id}>{inner}</Fragment> : null;
      })}
      {footer ? <CtaSection section={footer} /> : null}
    </MinistryPageShell>
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
