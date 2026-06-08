"use client";

import { contentStr, fieldVisible, sortedListItems } from "@/lib/site-builder/content-utils";
import { getFieldStyle } from "@/lib/site-builder/content-utils";
import type { PageSection } from "@/lib/site-builder/types";
import { EditableElement } from "../editable-element";
import { ContentElementsBlock } from "../content-elements-block";
import { SiteBuilderFormattedContent } from "../site-builder-formatted-content";
import { useBuilderPreview } from "../builder-preview-context";
import { isElementVisible } from "@/lib/site-builder/element-style-utils";
import { cn } from "@/lib/utils";

export function TimelineSection({ section }: { section: PageSection }) {
  const ctx = useBuilderPreview();
  const c = section.content;
  const headline = contentStr(c, "headline");
  const intro = contentStr(c, "intro");
  const items = ctx?.editMode
    ? sortedListItems(c.items, { includeHidden: true })
    : sortedListItems(c.items).filter(
        (x) => x.visible && isElementVisible(x.style, true) && x.text.trim(),
      );

  const show = (key: string, text: string) =>
    ctx?.editMode || (text.trim().length > 0 && fieldVisible(c, key));

  if (!ctx?.editMode && !headline.trim() && items.length === 0) return null;

  return (
    <section className="border-t border-brand-primary/15 px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl">
        {show("headline", headline) ? (
          <EditableElement sectionId={section.id} elementId="headline" style={getFieldStyle(c, "headline")}>
            <SiteBuilderFormattedContent
              text={headline}
              className="font-serif text-2xl text-brand-primary tracking-wide text-center"
              emptyPlaceholder={ctx?.editMode ? "Headline (empty)" : undefined}
            />
          </EditableElement>
        ) : null}
        {show("intro", intro) ? (
          <EditableElement sectionId={section.id} elementId="intro" style={getFieldStyle(c, "intro")}>
            <SiteBuilderFormattedContent
              text={intro}
              className="mt-3 text-center text-brand-ink/80 leading-relaxed"
              emptyPlaceholder={ctx?.editMode ? "Intro (empty)" : undefined}
            />
          </EditableElement>
        ) : null}
        <ul className="mt-10 space-y-8">
          {items.map((item) => {
            if (!ctx?.editMode && (!item.visible || !isElementVisible(item.style, true))) return null;
            return (
              <li
                key={item.id}
                className={cn(
                  "border-l-2 border-brand-primary/30 pl-5",
                  !item.visible && ctx?.editMode && "opacity-50",
                )}
              >
                <EditableElement
                  sectionId={section.id}
                  elementId={`item:${item.id}`}
                  style={item.style}
                  visible={item.visible}
                  layout="block"
                >
                  <SiteBuilderFormattedContent
                    text={String(item.metadata?.when ?? "")}
                    className="text-xs font-semibold uppercase tracking-wide text-brand-primary/80"
                  />
                  <SiteBuilderFormattedContent
                    text={item.text}
                    className="mt-1 font-serif text-lg text-brand-ink"
                  />
                  <SiteBuilderFormattedContent
                    text={String(item.metadata?.description ?? "")}
                    className="mt-2 text-sm text-brand-ink/80 leading-relaxed"
                  />
                </EditableElement>
              </li>
            );
          })}
        </ul>
        <ContentElementsBlock section={section} />
      </div>
    </section>
  );
}
