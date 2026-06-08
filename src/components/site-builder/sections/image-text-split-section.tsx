"use client";

import Link from "next/link";
import { contentStr, fieldVisible } from "@/lib/site-builder/content-utils";
import { getFieldStyle } from "@/lib/site-builder/content-utils";
import type { PageSection } from "@/lib/site-builder/types";
import { EditableElement } from "../editable-element";
import { ContentElementsBlock } from "../content-elements-block";
import { SiteBuilderFormattedContent } from "../site-builder-formatted-content";
import { useBuilderPreview } from "../builder-preview-context";
import { buttonClassesFromStyle, elementStyleProps } from "@/lib/site-builder/element-style-utils";
import { cn } from "@/lib/utils";

export function ImageTextSplitSection({
  section,
  index,
}: {
  section: PageSection;
  index: number;
}) {
  const ctx = useBuilderPreview();
  const c = section.content;
  const title = contentStr(c, "headline");
  const body = contentStr(c, "body");
  const ctaLabel = contentStr(c, "ctaLabel");
  const ctaUrl = contentStr(c, "ctaUrl") || "#";
  const imgUrl = contentStr(c, "imageUrl").trim();

  if (!ctx?.editMode && !title.trim() && !body.trim()) return null;

  const isTextLeft = index % 2 === 0;
  const sectionBg = index % 2 === 0 ? "bg-white" : "bg-neutral-50";
  const imgStyle = getFieldStyle(c, "image");
  const { className: imgCls, style: imgInline } = elementStyleProps(imgStyle);
  const btnStyle = getFieldStyle(c, "cta:primary");

  const textColumn = (
    <div className="col-span-2 md:col-span-1 border-l-2 border-blue-200/80 pl-4 space-y-3">
      {(title.trim() || ctx?.editMode) && fieldVisible(c, "headline") ? (
        <EditableElement sectionId={section.id} elementId="headline" style={getFieldStyle(c, "headline")}>
          <h2 className="font-serif text-2xl text-brand-primary tracking-wide">
            {title.trim() || (ctx?.editMode ? "Headline…" : "")}
          </h2>
        </EditableElement>
      ) : null}
      {(body.trim() || ctx?.editMode) && fieldVisible(c, "body") ? (
        <EditableElement sectionId={section.id} elementId="body" style={getFieldStyle(c, "body")}>
          <SiteBuilderFormattedContent
            text={body}
            className="text-brand-ink/85"
            emptyPlaceholder={ctx?.editMode ? "Body text…" : undefined}
          />
        </EditableElement>
      ) : null}
      {ctaLabel.trim() ? (
        <EditableElement
          sectionId={section.id}
          elementId="cta:primary"
          style={btnStyle}
          layout="inline"
          styleOnWrapper={false}
        >
          <Link href={ctaUrl} className={cn(buttonClassesFromStyle(btnStyle), "hover:underline")}>
            {ctaLabel}
          </Link>
        </EditableElement>
      ) : null}
      <ContentElementsBlock section={section} />
    </div>
  );

  const visualColumn = imgUrl ? (
    <EditableElement
      sectionId={section.id}
      elementId="image"
      style={imgStyle}
      className="col-span-2 md:col-span-1 flex items-center justify-center md:justify-end"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgUrl}
        alt={contentStr(c, "imageAlt")}
        className={cn(
          "max-h-64 w-full max-w-md rounded-lg object-cover shadow-sm border border-gray-200/80",
          imgCls,
        )}
        style={imgInline}
      />
    </EditableElement>
  ) : (
    <div className="hidden md:block md:col-span-1 min-h-[5rem]" aria-hidden />
  );

  return (
    <section className={sectionBg}>
      <div className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
        <div className="border-t border-gray-200 w-full mb-8 sm:mb-10" />
        <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-center">
          {isTextLeft ? (
            <>
              {textColumn}
              {visualColumn}
            </>
          ) : (
            <>
              {visualColumn}
              {textColumn}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
