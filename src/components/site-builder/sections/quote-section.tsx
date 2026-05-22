"use client";

import { contentStr, fieldVisible } from "@/lib/site-builder/content-utils";
import { getFieldStyle } from "@/lib/site-builder/content-utils";
import type { PageSection } from "@/lib/site-builder/types";
import { EditableElement } from "../editable-element";
import { ContentElementsBlock } from "../content-elements-block";
import { elementStyleProps } from "@/lib/site-builder/element-style-utils";

export function QuoteSection({ section }: { section: PageSection }) {
  const c = section.content;
  const quote = contentStr(c, "quote");
  const attr = contentStr(c, "attribution");
  const quoteStyle = getFieldStyle(c, "quote:text");
  const { className: qCls, style: qInline } = elementStyleProps(quoteStyle);

  if (!quote.trim()) return null;

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      {fieldVisible(c, "quote:text") ? (
        <EditableElement sectionId={section.id} elementId="quote:text" style={quoteStyle}>
          <blockquote
            className={`rounded-xl border border-brand-primary/20 bg-white/60 p-6 text-brand-ink/90 italic leading-relaxed ${qCls}`}
            style={qInline}
          >
            {quote}
          </blockquote>
        </EditableElement>
      ) : null}
      {attr.trim() && fieldVisible(c, "quote:attribution") ? (
        <EditableElement
          sectionId={section.id}
          elementId="quote:attribution"
          style={getFieldStyle(c, "quote:attribution")}
        >
          <p className="mt-3 text-sm font-medium text-brand-primary">{attr}</p>
        </EditableElement>
      ) : null}
      <ContentElementsBlock section={section} />
    </section>
  );
}
