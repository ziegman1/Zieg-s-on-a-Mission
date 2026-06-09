import type { ElementStyle } from "@/lib/site-builder/element-types";

/** Shared focus, disabled, and layout for storefront CTAs. */
export const STOREFRONT_BUTTON_BASE =
  "inline-flex shrink-0 items-center justify-center rounded-full font-medium whitespace-nowrap transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

const SIZE_CLASSES = {
  sm: "h-9 px-4 text-sm",
  md: "h-12 px-7 text-sm",
  lg: "h-14 px-9 text-base",
} as const;

/** Gold primary CTA — dark text always visible. */
export const STOREFRONT_BUTTON_PRIMARY = [
  STOREFRONT_BUTTON_BASE,
  SIZE_CLASSES.md,
  "bg-brand-accent text-brand-ink font-semibold shadow-sm",
  "hover:bg-[#d9a534] hover:text-brand-ink hover:shadow-md",
  "active:bg-[#c9952f] active:text-brand-ink",
  "focus-visible:ring-brand-accent/50",
  "disabled:text-brand-ink/70",
].join(" ");

/** White secondary/outline CTA — brand border, dark text, light blue hover fill. */
export const STOREFRONT_BUTTON_SECONDARY = [
  STOREFRONT_BUTTON_BASE,
  SIZE_CLASSES.md,
  "border border-brand-primary/50 bg-white text-brand-ink shadow-xs",
  "hover:border-brand-primary/60 hover:bg-brand-primary/10 hover:text-brand-ink",
  "active:border-brand-primary/70 active:bg-brand-primary/15 active:text-brand-ink",
  "focus-visible:ring-brand-primary/40",
  "disabled:bg-white disabled:text-brand-ink/50",
].join(" ");

/** Text-only brand CTA with light hover fill. */
export const STOREFRONT_BUTTON_GHOST = [
  STOREFRONT_BUTTON_BASE,
  SIZE_CLASSES.md,
  "bg-transparent text-brand-primary",
  "hover:bg-brand-primary/10 hover:text-brand-primary",
  "active:bg-brand-primary/15 active:text-brand-primary",
  "focus-visible:ring-brand-primary/40",
  "disabled:text-brand-ink/45",
].join(" ");

/** Brand blue filled button (legacy Site Builder “Filled” style). */
export const STOREFRONT_BUTTON_BRAND = [
  STOREFRONT_BUTTON_BASE,
  SIZE_CLASSES.md,
  "bg-brand-primary text-white font-semibold shadow-sm",
  "hover:bg-brand-primary/90 hover:text-white",
  "active:bg-brand-primary/80 active:text-white",
  "focus-visible:ring-brand-primary/40",
  "disabled:text-white/75",
].join(" ");

export type StorefrontButtonRole = "primary" | "secondary" | "outline" | "ghost" | "brand";

export function storefrontButtonClasses(
  role: StorefrontButtonRole = "primary",
  size: keyof typeof SIZE_CLASSES = "md",
): string {
  const sizeCls = SIZE_CLASSES[size];
  switch (role) {
    case "secondary":
    case "outline":
      return STOREFRONT_BUTTON_SECONDARY.replace(SIZE_CLASSES.md, sizeCls);
    case "ghost":
      return STOREFRONT_BUTTON_GHOST.replace(SIZE_CLASSES.md, sizeCls);
    case "brand":
      return STOREFRONT_BUTTON_BRAND.replace(SIZE_CLASSES.md, sizeCls);
    case "primary":
    default:
      return STOREFRONT_BUTTON_PRIMARY.replace(SIZE_CLASSES.md, sizeCls);
  }
}

/** Site Builder element style → storefront button classes. */
export function buttonClassesFromStyle(style?: ElementStyle): string {
  const size = style?.buttonSize ?? "md";
  switch (style?.buttonVariant) {
    case "outline":
      return storefrontButtonClasses("secondary", size);
    case "ghost":
      return storefrontButtonClasses("ghost", size);
    case "default":
      return storefrontButtonClasses("brand", size);
    case "accent":
      return storefrontButtonClasses("primary", size);
    default:
      return storefrontButtonClasses("primary", size);
  }
}
