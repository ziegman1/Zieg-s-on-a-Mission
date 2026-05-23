import {
  isLocalFileNewsletterUrl,
  normalizeNewsletterLinkUrl,
  isValidNewsletterLinkUrl,
} from "@/lib/newsletter/cta-url";
import type { NewsletterBlock, NewsletterBlocks } from "./types";

/** Hosted http(s) or site path only — strips file:// and other invalid URLs for email. */
export function resolveHostedUrlForEmail(url: string): string | null {
  const t = normalizeNewsletterLinkUrl(url);
  if (!t || isLocalFileNewsletterUrl(t) || !isValidNewsletterLinkUrl(t)) return null;
  return t;
}

function sanitizeBlockLink(block: NewsletterBlock): NewsletterBlock {
  switch (block.type) {
    case "button": {
      const url = resolveHostedUrlForEmail(block.url);
      return url ? { ...block, url } : { ...block, url: "" };
    }
    case "document": {
      const documentUrl = resolveHostedUrlForEmail(block.documentUrl);
      return documentUrl ? { ...block, documentUrl } : { ...block, documentUrl: "" };
    }
    case "image_text": {
      const buttonUrl = resolveHostedUrlForEmail(block.buttonUrl);
      return buttonUrl
        ? { ...block, buttonUrl }
        : { ...block, buttonUrl: block.buttonUrl.trim() ? "" : block.buttonUrl };
    }
    default:
      return block;
  }
}

export function sanitizeNewsletterBlocksForEmail(blocks: NewsletterBlocks): NewsletterBlocks {
  return blocks.map(sanitizeBlockLink);
}
