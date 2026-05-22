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
import { visibleListItems } from "@/lib/site-builder/content-utils";
import { contentStr } from "@/lib/site-builder/content-utils";

export function PageSectionsRenderer({
  pageKey,
  sections,
  siteTagline = "",
}: {
  pageKey: string;
  sections: PageSection[];
  siteTagline?: string;
}) {
  const visible = sections.filter((s) => s.visible);
  let splitIndex = 0;

  if (pageKey === "home") {
    return (
      <div>
        {visible.map((section) => {
          switch (section.sectionType) {
            case "hero":
              return <HeroSection key={section.id} section={section} useScriptTitle />;
            case "image_text_split": {
              const idx = splitIndex++;
              return (
                <Fragment key={section.id}>
                  <ImageTextSplitSection section={section} index={idx} />
                </Fragment>
              );
            }
            case "text_section":
              return <TextSectionBlock key={section.id} section={section} />;
            case "card_grid":
              return <CardGridSection key={section.id} section={section} />;
            case "cta":
              return <CtaSection key={section.id} section={section} siteTagline={siteTagline} />;
            default:
              return null;
          }
        })}
      </div>
    );
  }

  if (pageKey === "partner") {
    return (
      <div className="bg-brand-surface text-brand-ink">
        {visible.map((section) => renderPartnerSection(section))}
      </div>
    );
  }

  if (["about", "mission", "blog", "contact", "give", "merch"].includes(pageKey)) {
    return <MinistrySectionsPage pageKey={pageKey} sections={visible} />;
  }

  return (
    <div>
      {visible.map((section) => renderGenericSection(section, siteTagline))}
    </div>
  );
}

function renderPartnerSection(section: PageSection) {
  switch (section.sectionType) {
    case "hero":
      return <HeroSection key={section.id} section={section} />;
    case "text_section":
      return <TextSectionBlock key={section.id} section={section} />;
    case "card_grid":
      return <CardGridSection key={section.id} section={section} />;
    case "timeline":
      return <TimelineSection key={section.id} section={section} />;
    case "quote":
      return <QuoteSection key={section.id} section={section} />;
    case "cta":
      return <CtaSection key={section.id} section={section} />;
    default:
      return null;
  }
}

function renderGenericSection(section: PageSection, siteTagline: string) {
  switch (section.sectionType) {
    case "hero":
      return <HeroSection key={section.id} section={section} />;
    case "text_section":
      return <TextSectionBlock key={section.id} section={section} />;
    case "cta":
      return <CtaSection key={section.id} section={section} siteTagline={siteTagline} />;
    case "quote":
      return <QuoteSection key={section.id} section={section} />;
    default:
      return null;
  }
}

function MinistrySectionsPage({
  pageKey,
  sections,
}: {
  pageKey: string;
  sections: PageSection[];
}) {
  const header = sections.find((s) => s.sectionKey === "header");
  const rest = sections.filter((s) => s.sectionKey !== "header" && s.sectionKey !== "footer-nav");

  const title = header ? contentStr(header.content, "headline") : "";
  const lede = header
    ? contentStr(header.content, "body") || contentStr(header.content, "subheadline")
    : "";

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
