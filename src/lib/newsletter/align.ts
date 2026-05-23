import type { ButtonAlign } from "./blocks/types";

export type CtaAlign = ButtonAlign;

const CTA_ALIGNS: readonly CtaAlign[] = ["left", "center", "right"];

export function parseCtaAlign(value: string | null | undefined, fallback: CtaAlign = "center"): CtaAlign {
  if (value === "left" || value === "right") return value;
  if (value === "center") return "center";
  return fallback;
}

export function flexJustifyClass(align: CtaAlign): string {
  if (align === "left") return "justify-start";
  if (align === "right") return "justify-end";
  return "justify-center";
}

export function textAlignClass(align: CtaAlign): string {
  if (align === "left") return "text-left";
  if (align === "right") return "text-right";
  return "text-center";
}

export function isCtaAlign(value: unknown): value is CtaAlign {
  return typeof value === "string" && (CTA_ALIGNS as readonly string[]).includes(value);
}
