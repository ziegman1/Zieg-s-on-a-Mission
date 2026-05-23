import type { CommunityCoverMimeType } from "@/lib/community/media-upload";
import {
  buildNewsletterAssetPathFromMime,
  buildNewsletterDocumentPath,
  type NewsletterImagePurpose,
} from "@/lib/newsletter/storage-paths";
import {
  getSupabaseProjectUrl,
  NEWSLETTER_ASSETS_BUCKET,
  supabaseServiceRoleKeyErrorMessage,
} from "@/lib/supabase/config";
import { getSupabaseStorageAdmin } from "@/lib/supabase/storage-admin";

export function getNewsletterAssetPublicUrl(storagePath: string): string | null {
  const base = getSupabaseProjectUrl();
  if (!base) return null;
  const encoded = storagePath
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return `${base}/storage/v1/object/public/${NEWSLETTER_ASSETS_BUCKET}/${encoded}`;
}

function mapStorageUploadError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("invalid compact jws") ||
    lower.includes("expected 3 parts in jwt") ||
    (lower.includes("jwt") && lower.includes("malformed"))
  ) {
    return supabaseServiceRoleKeyErrorMessage("new_secret_format");
  }
  if (lower.includes("placeholder") || lower.includes("too short")) {
    return supabaseServiceRoleKeyErrorMessage("placeholder");
  }
  if (lower.includes("unauthorized") || lower.includes("invalid api key")) {
    return "Upload failed. Check Supabase credentials.";
  }
  if (lower.includes("forbidden") || lower.includes("permission denied")) {
    return (
      "Upload failed. Confirm the newsletter-assets bucket exists " +
      "(see docs/supabase-newsletter-assets.md)."
    );
  }
  if (lower.includes("payload too large") || lower.includes("file size")) {
    return "File exceeds size limit.";
  }
  if (lower.includes("mime") || lower.includes("not allowed")) {
    return "Unsupported file type.";
  }
  return message || "Upload failed.";
}

/** Upload newsletter image to Supabase Storage (`newsletter-assets` bucket). */
export async function uploadNewsletterAsset(
  bytes: Buffer,
  contentType: CommunityCoverMimeType,
  purpose: NewsletterImagePurpose,
  options?: { newsletterId?: string },
): Promise<{ url: string; path: string }> {
  const supabase = getSupabaseStorageAdmin();
  const path = buildNewsletterAssetPathFromMime(purpose, contentType, options);

  const { error } = await supabase.storage.from(NEWSLETTER_ASSETS_BUCKET).upload(path, bytes, {
    contentType,
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    if (error.message?.toLowerCase().includes("bucket") || error.message?.includes("not found")) {
      throw new Error(
        `Storage bucket "${NEWSLETTER_ASSETS_BUCKET}" is missing. ` +
          "Create it in Supabase (see docs/supabase-newsletter-assets.md).",
      );
    }
    throw new Error(mapStorageUploadError(error.message || "Upload failed"));
  }

  const url = getNewsletterAssetPublicUrl(path);
  if (!url) throw new Error("Upload failed. Could not build public URL.");
  return { url, path };
}

const PDF_MIME = "application/pdf";

/** Upload newsletter PDF to Supabase Storage (`newsletter-assets` bucket). */
export async function uploadNewsletterDocument(
  bytes: Buffer,
  options?: { newsletterId?: string },
): Promise<{ url: string; path: string }> {
  const supabase = getSupabaseStorageAdmin();
  const path = buildNewsletterDocumentPath("pdf", options);

  const { error } = await supabase.storage.from(NEWSLETTER_ASSETS_BUCKET).upload(path, bytes, {
    contentType: PDF_MIME,
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    if (error.message?.toLowerCase().includes("bucket") || error.message?.includes("not found")) {
      throw new Error(
        `Storage bucket "${NEWSLETTER_ASSETS_BUCKET}" is missing. ` +
          "Create it in Supabase (see docs/supabase-newsletter-assets.md).",
      );
    }
    throw new Error(mapStorageUploadError(error.message || "Upload failed"));
  }

  const url = getNewsletterAssetPublicUrl(path);
  if (!url) throw new Error("Upload failed. Could not build public URL.");
  return { url, path };
}
