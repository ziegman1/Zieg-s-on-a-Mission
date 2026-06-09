"use client";

import Link from "next/link";
import { contentStr, fieldVisible, getFieldStyle } from "@/lib/site-builder/content-utils";
import { buttonClassesFromStyle } from "@/lib/site-builder/element-style-utils";
import type { PageSection } from "@/lib/site-builder/types";
import {
  storefrontButtonClasses,
  type StorefrontButtonRole,
} from "@/lib/storefront/storefront-button-styles";
import { cn } from "@/lib/utils";
import { EditableElement } from "../editable-element";
import { useBuilderPreview } from "../builder-preview-context";

function TextSectionCtaButton({
  section,
  slot,
  label,
  url,
  role = "primary",
}: {
  section: PageSection;
  slot: "primary" | "secondary";
  label: string;
  url: string;
  role?: StorefrontButtonRole;
}) {
  const ctx = useBuilderPreview();
  const elementId = `cta:${slot}`;
  const style = getFieldStyle(section.content, elementId);
  if (!label.trim()) return null;
  if (!ctx?.editMode && !fieldVisible(section.content, elementId)) return null;

  const className = cn(
    style?.buttonVariant || style?.buttonSize
      ? buttonClassesFromStyle(style)
      : storefrontButtonClasses(role),
  );

  return (
    <EditableElement
      sectionId={section.id}
      elementId={elementId}
      style={style}
      layout="inline"
      styleOnWrapper={false}
    >
      <Link href={url} data-slot="button" className={className}>
        {label}
      </Link>
    </EditableElement>
  );
}

export function TextSectionCtaButtons({
  section,
  primaryVariant = "primary",
  secondaryVariant = "secondary",
}: {
  section: PageSection;
  primaryVariant?: StorefrontButtonRole;
  secondaryVariant?: StorefrontButtonRole;
}) {
  const c = section.content;
  const primary = contentStr(c, "primaryCtaLabel");
  const primaryUrl = contentStr(c, "primaryCtaUrl") || "/contact";
  const secondary = contentStr(c, "secondaryCtaLabel");
  const secondaryUrl = contentStr(c, "secondaryCtaUrl") || "/partner";

  if (!primary.trim() && !secondary.trim()) return null;

  return (
    <div className="not-prose mt-6 flex flex-wrap gap-3">
      <TextSectionCtaButton
        section={section}
        slot="primary"
        label={primary}
        url={primaryUrl}
        role={primaryVariant}
      />
      <TextSectionCtaButton
        section={section}
        slot="secondary"
        label={secondary}
        url={secondaryUrl}
        role={secondaryVariant}
      />
    </div>
  );
}
