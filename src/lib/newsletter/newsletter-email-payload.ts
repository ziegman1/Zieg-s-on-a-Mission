import type { NewsletterBlocks } from "./blocks/types";
import { parseCtaAlign } from "./align";
import type { NewsletterBrandSettings } from "./brand-types";
import { resolveNewsletterFooter, resolveNewsletterFooterImage } from "./resolve-footer";
import { resolveNewsletterHeader } from "./resolve-header";
import type { NewsletterRecord } from "./types";

/** Mail Suite / email renderer input — no sending, structure only. */
export type NewsletterEmailPayload = {
  title: string;
  subtitle: string;
  excerpt: string;
  header: { imageUrl: string | null; alt: string };
  footer: {
    imageUrl: string | null;
    alt: string;
    text: string;
  };
  cta: {
    label: string;
    url: string;
    align: "left" | "center" | "right";
  } | null;
  blocks: NewsletterBlocks;
  featuredImageUrl: string | null;
};

export function buildNewsletterEmailPayload(
  newsletter: NewsletterRecord,
  brand: NewsletterBrandSettings,
): NewsletterEmailPayload {
  const header = resolveNewsletterHeader(newsletter, brand);
  const footer = resolveNewsletterFooter(newsletter, brand);
  const label = newsletter.ctaLabel.trim() || brand.defaultCtaLabel.trim();
  const url = newsletter.ctaUrl.trim() || brand.defaultCtaUrl.trim();
  const cta =
    label && url
      ? {
          label,
          url,
          align: parseCtaAlign(newsletter.ctaAlign),
        }
      : null;

  return {
    title: newsletter.title,
    subtitle: newsletter.subtitle,
    excerpt: newsletter.excerpt,
    header,
    footer,
    cta,
    blocks: newsletter.bodyBlocks,
    featuredImageUrl: newsletter.featuredImageUrl,
  };
}

export { resolveNewsletterFooterImage };
