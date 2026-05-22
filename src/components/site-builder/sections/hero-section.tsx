"use client";

import Link from "next/link";
import { Dancing_Script } from "next/font/google";
import { DEFAULT_HOME_HERO_IMAGE_PATH } from "@/data/home-guided-default-sections";
import { contentStr, fieldVisible } from "@/lib/site-builder/content-utils";
import { getFieldStyle } from "@/lib/site-builder/content-utils";
import type { PageSection } from "@/lib/site-builder/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EditableElement } from "../editable-element";
import { ContentElementsBlock } from "../content-elements-block";
import { useBuilderPreview } from "../builder-preview-context";
import { buttonClassesFromStyle, elementStyleProps } from "@/lib/site-builder/element-style-utils";

const heroTitle = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

function HeroButton({
  section,
  slot,
  label,
  url,
}: {
  section: PageSection;
  slot: "primary" | "secondary" | "tertiary";
  label: string;
  url: string;
}) {
  const elementId = `cta:${slot}`;
  const style = getFieldStyle(section.content, elementId);
  if (!label.trim()) return null;
  const btnCls = buttonClassesFromStyle(style);
  const { className: wrapCls, style: wrapStyle } = elementStyleProps(style);

  return (
    <EditableElement sectionId={section.id} elementId={elementId} style={style}>
      <div className={cn("inline-block", wrapCls)} style={wrapStyle}>
        <Link href={url} className={btnCls}>
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
  const body = contentStr(c, "body");
  const primaryLabel = contentStr(c, "primaryCtaLabel");
  const primaryUrl = contentStr(c, "primaryCtaUrl") || "/partner";
  const secondaryLabel = contentStr(c, "secondaryCtaLabel");
  const secondaryUrl = contentStr(c, "secondaryCtaUrl") || "/give";
  const tertiaryLabel = contentStr(c, "tertiaryCtaLabel");
  const tertiaryUrl = contentStr(c, "tertiaryCtaUrl") || "/mission";

  const isHome = section.pageKey === "home";
  const imgStyle = getFieldStyle(c, "image");
  const { className: imgCls, style: imgInline } = elementStyleProps(imgStyle);

  if (!ctx?.editMode && !headline.trim() && !body.trim()) return null;

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
          className="absolute inset-0"
        >
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={contentStr(c, "imageAlt")}
              className={cn("w-full h-full object-cover object-center", imgCls)}
              style={imgInline}
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(234_229_225/0.4)_0%,transparent_48%)]" />
          </div>
        </EditableElement>
      ) : null}
      <div
        className={cn(
          "relative z-10 w-full mx-auto px-4 flex flex-col justify-center",
          isHome ? "max-w-7xl py-12 sm:py-16 min-h-[min(90vh,52rem)]" : "max-w-3xl text-center",
        )}
      >
        {eyebrow.trim() && fieldVisible(c, "eyebrow") ? (
          <EditableElement sectionId={section.id} elementId="eyebrow" style={getFieldStyle(c, "eyebrow")}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">{eyebrow}</p>
          </EditableElement>
        ) : null}
        {headline.trim() && fieldVisible(c, "headline") ? (
          <EditableElement sectionId={section.id} elementId="headline" style={getFieldStyle(c, "headline")}>
            <h1
              className={cn(
                useScriptTitle || isHome
                  ? `${heroTitle.className} text-[2.25rem] sm:text-4xl md:text-5xl font-bold text-brand-ink leading-[1.15]`
                  : "mt-4 font-serif text-3xl sm:text-4xl text-brand-ink tracking-wide",
              )}
            >
              {headline}
            </h1>
          </EditableElement>
        ) : null}
        {body.trim() && fieldVisible(c, "body") ? (
          <EditableElement sectionId={section.id} elementId="body" style={getFieldStyle(c, "body")}>
            <p className={cn("mt-5 text-lg text-brand-ink/85 leading-relaxed", isHome && "max-w-prose")}>
              {body}
            </p>
          </EditableElement>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3 justify-center sm:justify-start">
          <HeroButton section={section} slot="primary" label={primaryLabel} url={primaryUrl} />
          <HeroButton section={section} slot="secondary" label={secondaryLabel} url={secondaryUrl} />
          <HeroButton section={section} slot="tertiary" label={tertiaryLabel} url={tertiaryUrl} />
        </div>
        <ContentElementsBlock section={section} />
      </div>
    </section>
  );
}
