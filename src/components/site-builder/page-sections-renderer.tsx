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
import { visibleListItems, contentStr } from "@/lib/site-builder/content-utils";
import { EditableSectionShell } from "./editable-element";
import { useBuilderPreview } from "./builder-preview-context";
import { EDITABLE_SECTION_TYPES } from "@/lib/site-builder/section-elements";

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
  const rest = sections.filter((s) => s.sectionKey !== "header" && s.sectionKey !== "footer-nav");

  const title = header ? contentStr(header.content, "headline") : "";
  const lede = header
    ? contentStr(header.content, "body") || contentStr(header.content, "subheadline")
    : "";

  const useRich =
    inEditor && rest.some((s) => EDITABLE_SECTION_TYPES.includes(s.sectionType));

  if (useRich) {
    return (
      <MinistryPageShell title={title || pageKey} lede={lede}>
        {rest.map((section) => {
          const inner = renderMinistrySection(section);
          return inner ? wrap(section, inner) : null;
        })}
      </MinistryPageShell>
    );
  }

  return (
    <MinistryPageShell title={title || pageKey} lede={lede}>
      {rest.map((section) => {
        if (section.sectionType === "text_section") {
          return (
            <section key={section.id}>
              {contentStr(section.content, "headline").trim() ? (
                <h2>{contentStr(section.content, "headline")}</h2>
              ) : null}
              {contentStr(section.content, "body").trim() ? (
                <p className="whitespace-pre-wrap">{contentStr(section.content, "body")}</p>
              ) : null}
              {visibleListItems(section.content.bullets).length > 0 ? (
                <ul>
                  {visibleListItems(section.content.bullets).map((b) => (
                    <li key={b.id}>{b.text}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          );
        }
        if (section.sectionType === "featured_posts") {
          const topics = visibleListItems(section.content.topics);
          return (
            <section key={section.id}>
              {contentStr(section.content, "headline").trim() ? (
                <h2>{contentStr(section.content, "headline")}</h2>
              ) : null}
              {contentStr(section.content, "body").trim() ? (
                <p>{contentStr(section.content, "body")}</p>
              ) : null}
              {topics.length > 0 ? (
                <ul>
                  {topics.map((t) => (
                    <li key={t.id}>{t.text}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          );
        }
        return null;
      })}
    </MinistryPageShell>
  );
}

function renderMinistrySection(section: PageSection) {
  switch (section.sectionType) {
    case "text_section":
      return <TextSectionBlock section={section} />;
    case "quote":
      return <QuoteSection section={section} />;
    case "cta":
      return <CtaSection section={section} />;
    default:
      return null;
  }
}
