"use client";

import { contentStr, fieldVisible } from "@/lib/site-builder/content-utils";
import { getFieldStyle } from "@/lib/site-builder/content-utils";
import type { PageSection } from "@/lib/site-builder/types";
import { EditableElement } from "./editable-element";
import { ContentElementsBlock } from "./content-elements-block";
import { useBuilderPreview } from "./builder-preview-context";

/** Page header block (h1 + lede) with per-field selection in site builder. */
export function MinistryPageHeader({ section }: { section: PageSection }) {
  const ctx = useBuilderPreview();
  const c = section.content;
  const headline = contentStr(c, "headline");
  const body = contentStr(c, "body");
  const sub = contentStr(c, "subheadline");
  const eyebrow = contentStr(c, "eyebrow");

  const show = (key: string, text: string) =>
    ctx?.editMode || (text.trim().length > 0 && fieldVisible(c, key));

  return (
    <header className="mb-10">
      {show("eyebrow", eyebrow) ? (
        <EditableElement sectionId={section.id} elementId="eyebrow" style={getFieldStyle(c, "eyebrow")}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">
            {eyebrow.trim() || (ctx?.editMode ? "Eyebrow (empty)" : "")}
          </p>
        </EditableElement>
      ) : null}
      {show("headline", headline) ? (
        <EditableElement sectionId={section.id} elementId="headline" style={getFieldStyle(c, "headline")}>
          <h1 className="font-serif text-3xl sm:text-4xl text-brand-primary tracking-wide">
            {headline.trim() || (ctx?.editMode ? "Page title (empty)" : "")}
          </h1>
        </EditableElement>
      ) : null}
      {show("body", body) ? (
        <EditableElement sectionId={section.id} elementId="body" style={getFieldStyle(c, "body")}>
          <p className="mt-4 text-lg text-brand-ink/85 leading-relaxed max-w-2xl whitespace-pre-wrap">
            {body.trim() || (ctx?.editMode ? "Intro / lede (empty)" : "")}
          </p>
        </EditableElement>
      ) : null}
      {show("subheadline", sub) ? (
        <EditableElement
          sectionId={section.id}
          elementId="subheadline"
          style={getFieldStyle(c, "subheadline")}
        >
          <p
            className={
              body.trim()
                ? "mt-2 text-base text-brand-ink/75 max-w-2xl"
                : "mt-4 text-lg text-brand-ink/85 leading-relaxed max-w-2xl"
            }
          >
            {sub.trim() || (ctx?.editMode ? "Subheadline (empty)" : "")}
          </p>
        </EditableElement>
      ) : null}
      <ContentElementsBlock section={section} />
    </header>
  );
}
