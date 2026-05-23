import type { NewsletterBrandSettings } from "./brand-types";

export type ResolvedNewsletterFooter = {
  imageUrl: string | null;
  alt: string;
  text: string;
};

export type NewsletterFooterFields = {
  footerImageUrl: string | null;
  footerAltText: string;
  useDefaultFooterImage: boolean;
};

/** Resolve footer image (issue override → brand default). */
export function resolveNewsletterFooterImage(
  newsletter: NewsletterFooterFields,
  brand: NewsletterBrandSettings,
): { imageUrl: string | null; alt: string } {
  const override = newsletter.footerImageUrl?.trim();
  if (override) {
    const alt = newsletter.footerAltText.trim() || brand.footerAltText.trim();
    return { imageUrl: override, alt };
  }
  if (!newsletter.useDefaultFooterImage) {
    return { imageUrl: null, alt: brand.footerAltText };
  }
  const def = brand.defaultFooterImageUrl?.trim();
  if (def) {
    return { imageUrl: def, alt: brand.footerAltText };
  }
  return { imageUrl: null, alt: brand.footerAltText };
}

/** Full footer: image when configured, else brand default text. */
export function resolveNewsletterFooter(
  newsletter: NewsletterFooterFields,
  brand: NewsletterBrandSettings,
): ResolvedNewsletterFooter {
  const { imageUrl, alt } = resolveNewsletterFooterImage(newsletter, brand);
  return {
    imageUrl,
    alt,
    text: brand.defaultFooterText.trim(),
  };
}
