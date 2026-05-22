"use client";

import { EditableElement } from "./editable-element";
import { getContentElements } from "@/lib/site-builder/section-elements";
import { elementStyleProps, isElementVisible } from "@/lib/site-builder/element-style-utils";
import type { PageSection } from "@/lib/site-builder/types";
import { useBuilderPreview } from "./builder-preview-context";
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
        const Tag =
          el.type === "heading"
            ? "h3"
            : el.type === "quote"
              ? "blockquote"
              : el.type === "note"
                ? "p"
                : "p";
        const inner = (
          <Tag
            className={cn(
              el.type === "heading" && "font-serif text-xl text-brand-primary",
              el.type === "quote" && "italic border-l-4 border-brand-primary/30 pl-4",
              el.type === "note" && "text-sm text-brand-ink/70 bg-brand-surface/80 rounded-lg p-4",
              el.type === "paragraph" && "text-brand-ink/88 leading-relaxed whitespace-pre-wrap",
              className,
            )}
            style={style}
          >
            {el.text}
          </Tag>
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
