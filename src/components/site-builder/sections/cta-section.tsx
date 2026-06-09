"use client";

import Link from "next/link";
import { contentStr, fieldVisible } from "@/lib/site-builder/content-utils";
import { getFieldStyle } from "@/lib/site-builder/content-utils";
import type { PageSection } from "@/lib/site-builder/types";
import { buttonClassesFromStyle } from "@/lib/site-builder/element-style-utils";
import {
  storefrontButtonClasses,
  type StorefrontButtonRole,
} from "@/lib/storefront/storefront-button-styles";
import { cn } from "@/lib/utils";
import { EditableElement } from "../editable-element";
import { ContentElementsBlock } from "../content-elements-block";
import { SiteBuilderFormattedContent } from "../site-builder-formatted-content";

function CtaButton({
  section,
  slot,
  label,
  url,
  role,
  asLink = false,
}: {
  section: PageSection;
  slot: "primary" | "secondary";
  label: string;
  url: string;
  role: StorefrontButtonRole;
  asLink?: boolean;
}) {
  const elementId = `cta:${slot}`;
  const style = getFieldStyle(section.content, elementId);
  if (!label.trim()) return null;

  const className = cn(
    style?.buttonVariant || style?.buttonSize
      ? buttonClassesFromStyle(style)
      : storefrontButtonClasses(asLink ? "ghost" : role),
    asLink && "h-auto px-0 py-0 bg-transparent border-0 shadow-none hover:bg-transparent hover:underline",
  );

  return (
    <EditableElement
      sectionId={section.id}
      elementId={elementId}
      style={style}
      layout="inline"
      styleOnWrapper={false}
    >
      <Link href={url} data-slot="button" className={className}>
        {label}
      </Link>
    </EditableElement>
  );
}

export function CtaSection({
  section,
  siteTagline,
}: {
  section: PageSection;
  siteTagline?: string;
}) {
  const c = section.content;
  const headline = contentStr(c, "headline");
  const body = contentStr(c, "body");
  const primary = contentStr(c, "primaryCtaLabel");
  const primaryUrl = contentStr(c, "primaryCtaUrl") || "/partner";
  const secondary = contentStr(c, "secondaryCtaLabel");
  const secondaryUrl = contentStr(c, "secondaryCtaUrl") || "/give";

  if (!headline.trim() && !body.trim() && !primary.trim()) return null;

  if (section.pageKey === "home" && section.sectionKey === "closing") {
    return (
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
          <div className="border-t border-gray-200 w-full mb-8 sm:mb-10" />
          <div className="max-w-xl mx-auto text-center">
            {body.trim() && fieldVisible(c, "body") ? (
              <EditableElement sectionId={section.id} elementId="body" style={getFieldStyle(c, "body")}>
                <SiteBuilderFormattedContent text={body} className="text-brand-ink/88" />
              </EditableElement>
            ) : null}
            <div className="not-prose mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              <CtaButton section={section} slot="primary" label={primary} url={primaryUrl} role="primary" />
              <CtaButton
                section={section}
                slot="secondary"
                label={secondary}
                url={secondaryUrl}
                role="secondary"
                asLink
              />
            </div>
            {siteTagline?.trim() ? (
              <p className="mt-10 text-sm text-brand-ink/55">{siteTagline}</p>
            ) : null}
            <ContentElementsBlock section={section} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 text-center">
      {headline.trim() && fieldVisible(c, "headline") ? (
        <EditableElement sectionId={section.id} elementId="headline" style={getFieldStyle(c, "headline")}>
          <SiteBuilderFormattedContent
            text={headline}
            className="font-serif text-2xl text-brand-primary"
          />
        </EditableElement>
      ) : null}
      {body.trim() && fieldVisible(c, "body") ? (
        <EditableElement sectionId={section.id} elementId="body" style={getFieldStyle(c, "body")}>
          <SiteBuilderFormattedContent text={body} className="mt-4 text-brand-ink/85" />
        </EditableElement>
      ) : null}
      <div className="not-prose mt-6 flex flex-wrap justify-center gap-3">
        <CtaButton section={section} slot="primary" label={primary} url={primaryUrl} role="primary" />
        <CtaButton section={section} slot="secondary" label={secondary} url={secondaryUrl} role="secondary" />
      </div>
      <ContentElementsBlock section={section} />
    </section>
  );
}
