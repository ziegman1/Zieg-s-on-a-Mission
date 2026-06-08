"use client";

import Link from "next/link";
import { contentStr, fieldVisible, sortedListItems, visibleListItems } from "@/lib/site-builder/content-utils";
import { getFieldStyle } from "@/lib/site-builder/content-utils";
import type { PageSection } from "@/lib/site-builder/types";
import { MinistryPageShell } from "@/components/ministry-page-shell";
import { cn } from "@/lib/utils";
import { EditableElement } from "../editable-element";
import { ContentElementsBlock } from "../content-elements-block";
import { SiteBuilderFormattedContent } from "../site-builder-formatted-content";
import { useBuilderPreview } from "../builder-preview-context";
import { isElementVisible } from "@/lib/site-builder/element-style-utils";

export function TextSectionBlock({
  section,
  asPageShell = false,
}: {
  section: PageSection;
  asPageShell?: boolean;
}) {
  const ctx = useBuilderPreview();
  const c = section.content;
  const headline = contentStr(c, "headline");
  const sub = contentStr(c, "subheadline");
  const eyebrow = contentStr(c, "eyebrow");
  const body = contentStr(c, "body");
  const bullets = ctx?.editMode
    ? sortedListItems(c.bullets, { includeHidden: true })
    : visibleListItems(c.bullets);

  if (!headline.trim() && !body.trim() && !sub.trim() && bullets.length === 0 && !ctx?.editMode) {
    return null;
  }

  if (asPageShell && section.sectionKey === "header") {
    return (
      <MinistryPageShell title={headline} lede={sub || body}>
        {null}
      </MinistryPageShell>
    );
  }

  if (section.pageKey === "home" && section.sectionKey === "scroll-break") {
    return (
      <section className="py-16 sm:py-20 bg-blue-50">
        <div className="max-w-3xl mx-auto px-6 text-center text-lg text-gray-700 leading-relaxed">
          <EditableElement sectionId={section.id} elementId="body" style={getFieldStyle(c, "body")}>
            <SiteBuilderFormattedContent text={body} emptyPlaceholder={ctx?.editMode ? "Body (empty)" : undefined} />
          </EditableElement>
        </div>
        <ContentElementsBlock section={section} />
      </section>
    );
  }

  const show = (key: string, text: string) =>
    ctx?.editMode || (text.trim().length > 0 && fieldVisible(c, key));

  const inner = (
    <>
      {show("eyebrow", eyebrow) ? (
        <EditableElement sectionId={section.id} elementId="eyebrow" style={getFieldStyle(c, "eyebrow")}>
          <SiteBuilderFormattedContent
            text={eyebrow}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary"
            emptyPlaceholder={ctx?.editMode ? "Eyebrow (empty)" : undefined}
          />
        </EditableElement>
      ) : null}
      {show("headline", headline) ? (
        <EditableElement sectionId={section.id} elementId="headline" style={getFieldStyle(c, "headline")}>
          <SiteBuilderFormattedContent
            text={headline}
            className="font-serif text-2xl text-brand-primary tracking-wide mb-0"
            emptyPlaceholder={ctx?.editMode ? "Heading (empty)" : undefined}
          />
        </EditableElement>
      ) : null}
      {show("subheadline", sub) ? (
        <EditableElement sectionId={section.id} elementId="subheadline" style={getFieldStyle(c, "subheadline")}>
          <SiteBuilderFormattedContent
            text={sub}
            className="mt-2 text-lg text-brand-ink/80"
            emptyPlaceholder={ctx?.editMode ? "Subheadline (empty)" : undefined}
          />
        </EditableElement>
      ) : null}
      {show("body", body) ? (
        <EditableElement sectionId={section.id} elementId="body" style={getFieldStyle(c, "body")}>
          <SiteBuilderFormattedContent
            text={body}
            className="mt-4 text-brand-ink/88"
            emptyPlaceholder={ctx?.editMode ? "Body (empty)" : undefined}
          />
        </EditableElement>
      ) : null}
      {bullets.length > 0 ? (
        <ul className="mt-4 list-disc pl-5 space-y-1">
          {bullets.map((b) => {
            if (!ctx?.editMode && (!b.visible || !isElementVisible(b.style, true))) return null;
            return (
              <li
                key={b.id}
                className={cn(!b.visible && ctx?.editMode && "opacity-50 list-none")}
              >
                <EditableElement
                  sectionId={section.id}
                  elementId={`bullet:${b.id}`}
                  style={b.style}
                  visible={b.visible}
                  layout="inline"
                >
                  <SiteBuilderFormattedContent text={b.text} className="inline text-brand-ink/88" />
                </EditableElement>
              </li>
            );
          })}
        </ul>
      ) : null}
      <ContentElementsBlock section={section} />
    </>
  );

  return (
    <section
      className={cn(
        "mx-auto max-w-3xl px-4 py-12 sm:py-16",
        section.pageKey === "partner" && "py-16 sm:py-20",
      )}
    >
      {inner}
    </section>
  );
}

export function TextSectionNavLinks() {
  return (
    <nav className="!mt-12 pt-8 border-t border-brand-primary/25 flex flex-wrap gap-4 not-prose">
      <Link href="/partner" className="text-brand-primary font-medium hover:underline">
        Become a partner →
      </Link>
      <Link href="/give" className="text-brand-primary font-medium hover:underline">
        Give
      </Link>
    </nav>
  );
}
