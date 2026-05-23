import type { CSSProperties } from "react";
import type { NewsletterBrandSettings } from "./brand-types";

export type ResolvedNewsletterHeader = {
  imageUrl: string | null;
  alt: string;
};

export type NewsletterHeaderFields = {
  headerImageUrl: string | null;
  useDefaultBrandedHeader: boolean;
};

/** Resolve which header image URL to show (override → brand default). */
export function resolveNewsletterHeader(
  newsletter: NewsletterHeaderFields,
  brand: NewsletterBrandSettings,
): ResolvedNewsletterHeader {
  const override = newsletter.headerImageUrl?.trim();
  if (override) {
    return { imageUrl: override, alt: brand.headerAltText };
  }
  if (!newsletter.useDefaultBrandedHeader) {
    return { imageUrl: null, alt: brand.headerAltText };
  }
  const def = brand.defaultHeaderImageUrl?.trim();
  if (def) {
    return { imageUrl: def, alt: brand.headerAltText };
  }
  return { imageUrl: null, alt: brand.headerAltText };
}

/** Branded layout when a resolved header image is shown. */
export function isBrandedNewsletterLayout(header: ResolvedNewsletterHeader): boolean {
  return Boolean(header.imageUrl?.trim());
}

export function newsletterBrandCssVars(brand: NewsletterBrandSettings): CSSProperties {
  return {
    ["--newsletter-bg" as string]: brand.brandBackgroundColor,
    ["--newsletter-accent" as string]: brand.accentColor,
    ["--newsletter-line" as string]: brand.lineAccentColor,
    ["--newsletter-primary" as string]: "#5a8fb8",
  };
}
