import { extensionForCoverMime, type CommunityCoverMimeType } from "@/lib/community/media-upload";

export const NEWSLETTER_IMAGE_PURPOSES = [
  "header",
  "featured",
  "footer",
  "block",
] as const;

export type NewsletterImagePurpose = (typeof NEWSLETTER_IMAGE_PURPOSES)[number];

const BRANDING_PURPOSES: NewsletterImagePurpose[] = ["header", "footer"];

function safeExt(ext: string): string {
  return ext.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
}

function safeNewsletterId(newsletterId: string | undefined): string | null {
  if (!newsletterId?.trim()) return null;
  const id = newsletterId.trim();
  if (id === "new") return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) return null;
  return id;
}

/**
 * Paths under the `newsletter-assets` bucket:
 * - branding/header|footer/{uuid}.ext
 * - newsletters/{newsletterId}/featured|header|footer|blocks/{uuid}.ext
 * - temp/{purpose}/{uuid}.ext (draft before first save)
 */
export function buildNewsletterAssetPath(
  purpose: NewsletterImagePurpose,
  ext: string,
  options?: { newsletterId?: string },
): string {
  const safePurpose = NEWSLETTER_IMAGE_PURPOSES.includes(purpose) ? purpose : "block";
  const fileExt = safeExt(ext);
  const id = crypto.randomUUID();

  const newsletterId = safeNewsletterId(options?.newsletterId);
  if (newsletterId) {
    const folder =
      safePurpose === "block" ? "blocks" : safePurpose === "featured" ? "featured" : safePurpose;
    return `newsletters/${newsletterId}/${folder}/${id}.${fileExt}`;
  }

  if (BRANDING_PURPOSES.includes(safePurpose)) {
    return `branding/${safePurpose}/${id}.${fileExt}`;
  }

  return `temp/${safePurpose}/${id}.${fileExt}`;
}

export function buildNewsletterAssetPathFromMime(
  purpose: NewsletterImagePurpose,
  contentType: CommunityCoverMimeType,
  options?: { newsletterId?: string },
): string {
  return buildNewsletterAssetPath(purpose, extensionForCoverMime(contentType), options);
}

/** `newsletters/{id}/documents/{uuid}.pdf` or `temp/documents/{uuid}.pdf` */
export function buildNewsletterDocumentPath(
  ext: string,
  options?: { newsletterId?: string },
): string {
  const fileExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase() || "pdf";
  const id = crypto.randomUUID();
  const newsletterId = safeNewsletterId(options?.newsletterId);
  if (newsletterId) {
    return `newsletters/${newsletterId}/documents/${id}.${fileExt}`;
  }
  return `temp/documents/${id}.${fileExt}`;
}
