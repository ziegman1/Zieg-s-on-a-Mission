"use client";

import { contentStr, fieldVisible } from "@/lib/site-builder/content-utils";
import { getFieldStyle } from "@/lib/site-builder/content-utils";
import type { PageSection } from "@/lib/site-builder/types";
import { EditableElement } from "../editable-element";
import { ContentElementsBlock } from "../content-elements-block";
import { elementStyleProps } from "@/lib/site-builder/element-style-utils";
import { useBuilderPreview } from "../builder-preview-context";

export function QuoteSection({ section }: { section: PageSection }) {
  const ctx = useBuilderPreview();
  const c = section.content;
  const quote = contentStr(c, "quote");
  const attr = contentStr(c, "attribution");
  const quoteStyle = getFieldStyle(c, "quote:text");
  const { className: qCls, style: qInline } = elementStyleProps(quoteStyle);

  const show = (key: string, text: string) =>
    ctx?.editMode || (text.trim().length > 0 && fieldVisible(c, key));

  if (!ctx?.editMode && !quote.trim()) return null;

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      {show("quote:text", quote) ? (
        <EditableElement sectionId={section.id} elementId="quote:text" style={quoteStyle}>
          <blockquote
            className={`rounded-xl border border-brand-primary/20 bg-white/60 p-6 text-brand-ink/90 italic leading-relaxed ${qCls}`}
            style={qInline}
          >
            {quote.trim() || (ctx?.editMode ? "Quote (empty)" : "")}
          </blockquote>
        </EditableElement>
      ) : null}
      {show("quote:attribution", attr) ? (
        <EditableElement
          sectionId={section.id}
          elementId="quote:attribution"
          style={getFieldStyle(c, "quote:attribution")}
        >
          <p className="mt-3 text-sm font-medium text-brand-primary">
            {attr.trim() || (ctx?.editMode ? "Attribution (empty)" : "")}
          </p>
        </EditableElement>
      ) : null}
      <ContentElementsBlock section={section} />
    </section>
  );
}
