import {
  COMMUNITY_COVER_ALLOWED_TYPES,
  COMMUNITY_COVER_MAX_BYTES,
  isCommunityCoverMimeType,
} from "@/lib/community/media-upload";
import type { NewsletterImagePurpose } from "@/lib/newsletter/storage-paths";

export type { NewsletterImagePurpose };

export const NEWSLETTER_IMAGE_ACCEPT = COMMUNITY_COVER_ALLOWED_TYPES.join(",");

export function validateNewsletterImageFile(file: File): string | null {
  if (file.size > COMMUNITY_COVER_MAX_BYTES) {
    return "Image exceeds size limit.";
  }
  if (file.size < 1) {
    return "Image file is empty.";
  }
  if (!isCommunityCoverMimeType(file.type)) {
    return "Unsupported file type.";
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

export type NewsletterImageUploadOptions = {
  newsletterId?: string;
};

/** Client-side upload to admin API (Supabase Storage `newsletter-assets` bucket). */
export async function uploadNewsletterImageFile(
  file: File,
  purpose: NewsletterImagePurpose,
  options?: NewsletterImageUploadOptions,
): Promise<NewsletterImageUploadResult> {
  const validationError = validateNewsletterImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const fd = new FormData();
  fd.append("file", file);
  fd.append("purpose", purpose);
  if (options?.newsletterId?.trim()) {
    fd.append("newsletterId", options.newsletterId.trim());
  }

  const res = await fetch("/api/admin/upload-newsletter-image", {
    method: "POST",
    body: fd,
  });

  const data = (await res.json()) as { url?: string; storage?: string; error?: string };
  if (res.status === 401) {
    throw new Error("Upload failed. Sign in as an admin.");
  }
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "Upload failed.");
  }

  return { url: data.url, storage: data.storage };
}
