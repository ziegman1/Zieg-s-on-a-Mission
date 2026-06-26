"use client";

import Link from "next/link";
import { Dancing_Script } from "next/font/google";
import { DEFAULT_HOME_HERO_IMAGE_PATH } from "@/data/home-guided-default-sections";
import { contentStr, fieldVisible, getFieldStyle } from "@/lib/site-builder/content-utils";
import type { PageSection } from "@/lib/site-builder/types";
import { cn } from "@/lib/utils";
import { EditableElement } from "../editable-element";
import { ContentElementsBlock } from "../content-elements-block";
import { SiteBuilderFormattedContent } from "../site-builder-formatted-content";
import { useBuilderPreview } from "../builder-preview-context";
import { buttonClassesFromStyle, elementStyleProps } from "@/lib/site-builder/element-style-utils";
import {
  HOME_HERO_BODY,
  HOME_HERO_BODY_WITH_SUBHEADLINE,
  HOME_HERO_CONTENT,
  HOME_HERO_EYEBROW,
  HOME_HERO_HEADLINE,
  HOME_HERO_SUBHEADLINE,
  HOME_HERO_IMAGE,
  HOME_HERO_OVERLAY,
  homeHeroButtonClasses,
} from "./home-hero-visual";

const heroTitle = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

function HeroButton({
  section,
  slot,
  label,
  url,
  isHome,
}: {
  section: PageSection;
  slot: "primary" | "secondary" | "tertiary";
  label: string;
  url: string;
  isHome: boolean;
}) {
  const elementId = `cta:${slot}`;
  const style = getFieldStyle(section.content, elementId);
  if (!label.trim()) return null;
  const btnCls = isHome
    ? homeHeroButtonClasses(slot, style)
    : buttonClassesFromStyle(style);
  const { className: wrapCls, style: wrapStyle } = elementStyleProps(style);

  return (
    <EditableElement
      sectionId={section.id}
      elementId={elementId}
      style={style}
      layout="inline"
      styleOnWrapper={false}
    >
      <div className={cn("inline-block", wrapCls)} style={wrapStyle}>
        <Link href={url} data-slot="button" className={btnCls}>
          {label}
        </Link>
      </div>
    </EditableElement>
  );
}

export function HeroSection({
  section,
  className,
  useScriptTitle = false,
}: {
  section: PageSection;
  className?: string;
  useScriptTitle?: boolean;
}) {
  const ctx = useBuilderPreview();
  const c = section.content;
  const src = contentStr(c, "imageUrl").trim() || DEFAULT_HOME_HERO_IMAGE_PATH;
  const eyebrow = contentStr(c, "eyebrow");
  const headline = contentStr(c, "headline");
  const subheadline = contentStr(c, "subheadline");
  const body = contentStr(c, "body");
  const primaryLabel = contentStr(c, "primaryCtaLabel");
  const primaryUrl = contentStr(c, "primaryCtaUrl") || "/partner";
  const secondaryLabel = contentStr(c, "secondaryCtaLabel");
  const secondaryUrl = contentStr(c, "secondaryCtaUrl") || (section.pageKey === "home" ? "/mission" : "/give");
  const tertiaryLabel = contentStr(c, "tertiaryCtaLabel");
  const tertiaryUrl = contentStr(c, "tertiaryCtaUrl") || "/give";

  const isHome = section.pageKey === "home";
  const imgStyle = getFieldStyle(c, "image");
  const { className: imgCls, style: imgInline } = elementStyleProps(imgStyle);

  const show = (key: string, text: string) =>
    ctx?.editMode || (text.trim().length > 0 && fieldVisible(c, key));

  if (!ctx?.editMode && !headline.trim() && !subheadline.trim() && !body.trim()) return null;

  return (
    <section
      className={cn(
        "relative flex items-stretch border-b border-brand-primary/20",
        isHome ? "min-h-[min(90vh,52rem)]" : "px-4 py-16 sm:py-20 bg-gradient-to-b from-white/60 to-brand-surface",
        className,
      )}
    >
      {isHome ? (
        <EditableElement
          sectionId={section.id}
          elementId="image"
          style={imgStyle}
          layout="absolute"
          styleOnWrapper={false}
        >
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={contentStr(c, "imageAlt")}
              className={cn(HOME_HERO_IMAGE, imgCls)}
              style={imgInline}
            />
            <div className={HOME_HERO_OVERLAY} aria-hidden />
          </div>
        </EditableElement>
      ) : null}
      <div
        className={cn(
          "relative z-10 w-full mx-auto px-4 flex flex-col justify-center",
          isHome ? "max-w-7xl py-12 sm:py-16 min-h-[min(90vh,52rem)]" : "max-w-3xl text-center",
        )}
      >
        <div className={cn(isHome && HOME_HERO_CONTENT)}>
          {show("eyebrow", eyebrow) ? (
            <EditableElement sectionId={section.id} elementId="eyebrow" style={getFieldStyle(c, "eyebrow")}>
              <SiteBuilderFormattedContent
                text={eyebrow}
                className={cn(
                  "text-xs font-semibold uppercase tracking-[0.2em]",
                  isHome ? HOME_HERO_EYEBROW : "text-brand-primary",
                )}
                emptyPlaceholder={ctx?.editMode ? "Eyebrow (empty)" : undefined}
              />
            </EditableElement>
          ) : null}
          {show("headline", headline) ? (
            <EditableElement sectionId={section.id} elementId="headline" style={getFieldStyle(c, "headline")}>
              <SiteBuilderFormattedContent
                text={headline}
                className={cn(
                  useScriptTitle || isHome
                    ? `${heroTitle.className} text-[2.25rem] sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold leading-[1.15]`
                    : "mt-4 font-serif text-3xl sm:text-4xl text-brand-ink tracking-wide",
                  isHome ? HOME_HERO_HEADLINE : "text-brand-ink",
                )}
                emptyPlaceholder={ctx?.editMode ? "Headline (empty)" : undefined}
              />
            </EditableElement>
          ) : null}
          {show("subheadline", subheadline) ? (
            <EditableElement
              sectionId={section.id}
              elementId="subheadline"
              style={getFieldStyle(c, "subheadline")}
            >
              <SiteBuilderFormattedContent
                text={subheadline}
                className={cn(
                  isHome ? HOME_HERO_SUBHEADLINE : "mt-2 text-lg text-brand-ink/80 max-w-prose",
                )}
                emptyPlaceholder={ctx?.editMode ? "Subheadline (empty)" : undefined}
              />
            </EditableElement>
          ) : null}
          {show("body", body) ? (
            <EditableElement sectionId={section.id} elementId="body" style={getFieldStyle(c, "body")}>
              <SiteBuilderFormattedContent
                text={body}
                className={cn(
                  isHome
                    ? subheadline.trim()
                      ? HOME_HERO_BODY_WITH_SUBHEADLINE
                      : HOME_HERO_BODY
                    : "mt-5 text-lg text-brand-ink/85 max-w-prose",
                )}
                emptyPlaceholder={ctx?.editMode ? "Body (empty)" : undefined}
              />
            </EditableElement>
          ) : null}
          <div
            className={cn(
              "mt-8 flex flex-wrap gap-3",
              isHome ? "justify-start" : "justify-center sm:justify-start",
            )}
          >
            <HeroButton section={section} slot="primary" label={primaryLabel} url={primaryUrl} isHome={isHome} />
            <HeroButton
              section={section}
              slot="secondary"
              label={secondaryLabel}
              url={secondaryUrl}
              isHome={isHome}
            />
            <HeroButton
              section={section}
              slot="tertiary"
              label={tertiaryLabel}
              url={tertiaryUrl}
              isHome={isHome}
            />
          </div>
        </div>
        <ContentElementsBlock section={section} />
      </div>
    </section>
  );
}
