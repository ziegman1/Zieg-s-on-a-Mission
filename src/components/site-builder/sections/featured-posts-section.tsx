"use client";

import { contentStr, fieldVisible, sortedListItems } from "@/lib/site-builder/content-utils";
import { getFieldStyle } from "@/lib/site-builder/content-utils";
import type { PageSection } from "@/lib/site-builder/types";
import { EditableElement } from "../editable-element";
import { ContentElementsBlock } from "../content-elements-block";
import { useBuilderPreview } from "../builder-preview-context";
import { isElementVisible } from "@/lib/site-builder/element-style-utils";
import { cn } from "@/lib/utils";

export function FeaturedPostsSection({ section }: { section: PageSection }) {
  const ctx = useBuilderPreview();
  const c = section.content;
  const headline = contentStr(c, "headline");
  const body = contentStr(c, "body");
  const topics = ctx?.editMode
    ? sortedListItems(c.topics, { includeHidden: true })
    : sortedListItems(c.topics).filter(
        (t) => t.visible && isElementVisible(t.style, true) && t.text.trim(),
      );

  const show = (key: string, text: string) =>
    ctx?.editMode || (text.trim().length > 0 && fieldVisible(c, key));

  if (!ctx?.editMode && !headline.trim() && !body.trim() && topics.length === 0) {
    return null;
  }

  return (
    <section>
      {show("headline", headline) ? (
        <EditableElement sectionId={section.id} elementId="headline" style={getFieldStyle(c, "headline")}>
          <h2>{headline.trim() || (ctx?.editMode ? "Heading (empty)" : "")}</h2>
        </EditableElement>
      ) : null}
      {show("body", body) ? (
        <EditableElement sectionId={section.id} elementId="body" style={getFieldStyle(c, "body")}>
          <p>{body.trim() || (ctx?.editMode ? "Body (empty)" : "")}</p>
        </EditableElement>
      ) : null}
      {topics.length > 0 ? (
        <ul>
          {topics.map((t) => {
            if (!ctx?.editMode && (!t.visible || !isElementVisible(t.style, true))) return null;
            return (
              <li key={t.id} className={cn(!t.visible && ctx?.editMode && "opacity-50")}>
                <EditableElement
                  sectionId={section.id}
                  elementId={`topic:${t.id}`}
                  style={t.style}
                  visible={t.visible}
                  layout="inline"
                >
                  {t.text}
                </EditableElement>
              </li>
            );
          })}
        </ul>
      ) : null}
      <ContentElementsBlock section={section} />
    </section>
  );
}
