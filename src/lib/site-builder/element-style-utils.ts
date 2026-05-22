import type { CSSProperties } from "react";
import type { ElementStyle } from "./element-types";

const RADIUS: Record<NonNullable<ElementStyle["borderRadius"]>, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

const SHADOW: Record<NonNullable<ElementStyle["shadow"]>, string> = {
  none: "shadow-none",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
};

const PADDING: Record<NonNullable<ElementStyle["padding"]>, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-5",
  lg: "p-7",
  xl: "p-10",
};

const FONT_SIZE: Record<NonNullable<ElementStyle["fontSize"]>, string> = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
};

const FONT_WEIGHT: Record<NonNullable<ElementStyle["fontWeight"]>, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

const ALIGN: Record<NonNullable<ElementStyle["alignment"]>, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const MAX_WIDTH: Record<NonNullable<ElementStyle["maxWidth"]>, string> = {
  narrow: "max-w-md",
  normal: "max-w-2xl",
  wide: "max-w-4xl",
  full: "max-w-full",
};

const COL_SPAN: Record<NonNullable<ElementStyle["columnSpan"]>, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
};

const OBJECT_FIT: Record<NonNullable<ElementStyle["objectFit"]>, string> = {
  cover: "object-cover",
  contain: "object-contain",
};

export function isElementVisible(
  style: ElementStyle | undefined,
  fallbackVisible = true,
): boolean {
  if (style?.visible === false) return false;
  return fallbackVisible;
}

export function elementStyleProps(style?: ElementStyle): {
  className: string;
  style: CSSProperties;
} {
  if (!style) return { className: "", style: {} };

  const classes = [
    style.borderRadius ? RADIUS[style.borderRadius] : "",
    style.shadow ? SHADOW[style.shadow] : "",
    style.padding ? PADDING[style.padding] : "",
    style.fontSize ? FONT_SIZE[style.fontSize] : "",
    style.fontWeight ? FONT_WEIGHT[style.fontWeight] : "",
    style.fontStyle === "italic" ? "italic" : "",
    style.alignment ? ALIGN[style.alignment] : "",
    style.maxWidth ? MAX_WIDTH[style.maxWidth] : "",
    style.columnSpan ? COL_SPAN[style.columnSpan] : "",
    style.objectFit ? OBJECT_FIT[style.objectFit] : "",
    style.spacing === "tight" ? "space-y-1" : "",
    style.spacing === "loose" ? "space-y-6" : "",
  ].filter(Boolean);

  const inline: CSSProperties = {};
  if (style.backgroundColor) inline.backgroundColor = style.backgroundColor;
  if (style.textColor) inline.color = style.textColor;
  if (style.borderColor) inline.borderColor = style.borderColor;

  return { className: classes.join(" "), style: inline };
}

export function buttonClassesFromStyle(style?: ElementStyle): string {
  const variant = style?.buttonVariant ?? "default";
  const size = style?.buttonSize ?? "md";
  const sizeCls =
    size === "sm" ? "h-9 px-4 text-sm" : size === "lg" ? "h-14 px-9 text-lg" : "h-12 px-7";
  const variantCls =
    variant === "outline"
      ? "border border-brand-primary/50 bg-white/90"
      : variant === "ghost"
        ? "bg-transparent hover:bg-brand-primary/5"
        : variant === "accent"
          ? "bg-brand-accent text-brand-ink font-semibold"
          : "bg-brand-primary text-white";
  return `inline-flex items-center justify-center rounded-full ${sizeCls} ${variantCls}`;
}
