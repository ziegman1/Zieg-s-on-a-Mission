"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { contentStr, fieldVisible, getFieldStyle } from "@/lib/site-builder/content-utils";
import { buttonClassesFromStyle } from "@/lib/site-builder/element-style-utils";
import type { PageSection } from "@/lib/site-builder/types";
import { cn } from "@/lib/utils";
import { EditableElement } from "../editable-element";
import { useBuilderPreview } from "../builder-preview-context";

function TextSectionCtaButton({
  section,
  slot,
  label,
  url,
  variant = "primary",
}: {
  section: PageSection;
  slot: "primary" | "secondary";
  label: string;
  url: string;
  variant?: "primary" | "secondary" | "outline";
}) {
  const ctx = useBuilderPreview();
  const elementId = `cta:${slot}`;
  const style = getFieldStyle(section.content, elementId);
  if (!label.trim()) return null;
  if (!ctx?.editMode && !fieldVisible(section.content, elementId)) return null;

  const buttonClass =
    variant === "primary"
      ? "rounded-full px-8 h-12 bg-brand-accent text-brand-ink hover:bg-brand-accent/90 font-semibold shadow-md"
      : variant === "outline"
        ? "rounded-full px-8 h-11 border-brand-primary/50 text-brand-ink"
        : "rounded-full px-6 border-brand-primary/45";

  return (
    <EditableElement
      sectionId={section.id}
      elementId={elementId}
      style={style}
      layout="inline"
      styleOnWrapper={false}
    >
      <Button
        asChild
        variant={variant === "outline" || variant === "secondary" ? "outline" : "default"}
        className={cn(buttonClass, buttonClassesFromStyle(style))}
      >
        <Link href={url}>{label}</Link>
      </Button>
    </EditableElement>
  );
}

export function TextSectionCtaButtons({
  section,
  primaryVariant = "primary",
  secondaryVariant = "secondary",
}: {
  section: PageSection;
  primaryVariant?: "primary" | "secondary" | "outline";
  secondaryVariant?: "primary" | "secondary" | "outline";
}) {
  const c = section.content;
  const primary = contentStr(c, "primaryCtaLabel");
  const primaryUrl = contentStr(c, "primaryCtaUrl") || "/contact";
  const secondary = contentStr(c, "secondaryCtaLabel");
  const secondaryUrl = contentStr(c, "secondaryCtaUrl") || "/partner";

  if (!primary.trim() && !secondary.trim()) return null;

  return (
    <div className="mt-6 flex flex-wrap gap-3 not-prose">
      <TextSectionCtaButton
        section={section}
        slot="primary"
        label={primary}
        url={primaryUrl}
        variant={primaryVariant}
      />
      <TextSectionCtaButton
        section={section}
        slot="secondary"
        label={secondary}
        url={secondaryUrl}
        variant={secondaryVariant === "secondary" ? "outline" : secondaryVariant}
      />
    </div>
  );
}
