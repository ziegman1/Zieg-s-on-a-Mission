"use client";

import Link from "next/link";
import { contentStr, fieldVisible } from "@/lib/site-builder/content-utils";
import { getFieldStyle } from "@/lib/site-builder/content-utils";
import type { PageSection } from "@/lib/site-builder/types";
import { Button } from "@/components/ui/button";
import { EditableElement } from "../editable-element";
import { ContentElementsBlock } from "../content-elements-block";
import { buttonClassesFromStyle, elementStyleProps } from "@/lib/site-builder/element-style-utils";
import { cn } from "@/lib/utils";

function CtaButton({
  section,
  slot,
  label,
  url,
  asLink = false,
}: {
  section: PageSection;
  slot: "primary" | "secondary";
  label: string;
  url: string;
  asLink?: boolean;
}) {
  const elementId = `cta:${slot}`;
  const style = getFieldStyle(section.content, elementId);
  if (!label.trim()) return null;

  const inner = asLink ? (
    <Link href={url} className={cn(buttonClassesFromStyle(style), "hover:underline font-medium")}>
      {label}
    </Link>
  ) : (
    <Button asChild className="rounded-full px-6">
      <Link href={url} className={buttonClassesFromStyle(style)}>
        {label}
      </Link>
    </Button>
  );

  return (
    <EditableElement sectionId={section.id} elementId={elementId} style={style}>
      {inner}
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
                <p className="text-brand-ink/88 leading-relaxed">{body}</p>
              </EditableElement>
            ) : null}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              <CtaButton section={section} slot="primary" label={primary} url={primaryUrl} />
              <CtaButton section={section} slot="secondary" label={secondary} url={secondaryUrl} asLink />
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
          <h2 className="font-serif text-2xl text-brand-primary">{headline}</h2>
        </EditableElement>
      ) : null}
      {body.trim() && fieldVisible(c, "body") ? (
        <EditableElement sectionId={section.id} elementId="body" style={getFieldStyle(c, "body")}>
          <p className="mt-4 text-brand-ink/85 whitespace-pre-wrap">{body}</p>
        </EditableElement>
      ) : null}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <CtaButton section={section} slot="primary" label={primary} url={primaryUrl} />
        <CtaButton section={section} slot="secondary" label={secondary} url={secondaryUrl} />
      </div>
      <ContentElementsBlock section={section} />
    </section>
  );
}
