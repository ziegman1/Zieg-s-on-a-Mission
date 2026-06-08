"use client";

import { EditableElement } from "./editable-element";
import { getContentElements } from "@/lib/site-builder/section-elements";
import { buildInlineFormattedHtml } from "@/lib/site-builder/rich-text";
import { elementStyleProps, isElementVisible } from "@/lib/site-builder/element-style-utils";
import type { PageSection } from "@/lib/site-builder/types";
import { useBuilderPreview } from "./builder-preview-context";
import { SiteBuilderFormattedContent } from "./site-builder-formatted-content";
import { cn } from "@/lib/utils";

export function ContentElementsBlock({ section }: { section: PageSection }) {
  const ctx = useBuilderPreview();
  const elements = getContentElements(section.content).filter((el) =>
    ctx?.editMode ? true : el.visible && isElementVisible(el.style, true),
  );

  if (elements.length === 0) return null;

  return (
    <div className="space-y-4">
      {elements.map((el) => {
        const { className, style } = elementStyleProps(el.style);
        const inner =
          el.type === "heading" ? (
            <h3 className={cn("font-serif text-xl text-brand-primary", className)} style={style}>
              <span dangerouslySetInnerHTML={{ __html: buildInlineFormattedHtml(el.text) }} />
            </h3>
          ) : el.type === "quote" ? (
            <blockquote
              className={cn("italic border-l-4 border-brand-primary/30 pl-4", className)}
              style={style}
            >
              <SiteBuilderFormattedContent text={el.text} />
            </blockquote>
          ) : el.type === "note" ? (
            <div style={style}>
              <SiteBuilderFormattedContent
                text={el.text}
                className={cn("text-sm text-brand-ink/70 bg-brand-surface/80 rounded-lg p-4", className)}
              />
            </div>
          ) : (
            <div style={style}>
              <SiteBuilderFormattedContent text={el.text} className={cn("text-brand-ink/88", className)} />
            </div>
          );
        return (
          <EditableElement
            key={el.id}
            sectionId={section.id}
            elementId={`el:${el.id}`}
            style={el.style}
            visible={el.visible}
          >
            {inner}
          </EditableElement>
        );
      })}
    </div>
  );
}
