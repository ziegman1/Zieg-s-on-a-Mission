import {
  COMMUNITY_COVER_ALLOWED_TYPES,
  COMMUNITY_COVER_MAX_BYTES,
  isCommunityCoverMimeType,
  type NewsletterImagePurpose,
} from "@/lib/community/media-upload";

export type { NewsletterImagePurpose };

export const NEWSLETTER_IMAGE_ACCEPT = COMMUNITY_COVER_ALLOWED_TYPES.join(",");

export function validateNewsletterImageFile(file: File): string | null {
  if (file.size > COMMUNITY_COVER_MAX_BYTES) {
    return "Image must be 5 MB or smaller.";
  }
  if (file.size < 1) {
    return "Image file is empty.";
  }
  if (!isCommunityCoverMimeType(file.type)) {
    return "Use a JPG, PNG, or WebP image.";
  }
  return null;
}

export function isLikelyImageUrl(url: string): boolean {
  const t = url.trim();
  if (!t) return false;
  if (t.startsWith("/")) return true;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export type NewsletterImageUploadResult = {
  url: string;
  storage?: string;
};

/** Client-side upload to admin API. */
export async function uploadNewsletterImageFile(
  file: File,
  purpose: NewsletterImagePurpose,
): Promise<NewsletterImageUploadResult> {
  const validationError = validateNewsletterImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const fd = new FormData();
  fd.append("file", file);
  fd.append("purpose", purpose);

  const res = await fetch("/api/admin/upload-newsletter-image", {
    method: "POST",
    body: fd,
  });

  const data = (await res.json()) as { url?: string; storage?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "Upload failed");
  }

  return { url: data.url, storage: data.storage };
}
