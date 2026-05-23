import "server-only";

import type { CommunityCoverMimeType } from "@/lib/community/media-upload";
import {
  buildNewsletterAssetPathFromMime,
  buildNewsletterDocumentPath,
  type NewsletterImagePurpose,
} from "@/lib/newsletter/storage-paths";
import { mapSupabaseStorageErrorMessage } from "@/lib/newsletter/newsletter-upload-errors-client";
import { getSupabaseProjectUrl, NEWSLETTER_ASSETS_BUCKET } from "@/lib/supabase/config-env";
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

function logStorageUploadFailure(
  context: "image" | "document",
  path: string,
  error: { message?: string; statusCode?: string },
): void {
  console.error(`[newsletter-media] ${context} upload failed`, {
    bucket: NEWSLETTER_ASSETS_BUCKET,
    path,
    statusCode: error.statusCode,
    message: error.message,
  });
}

function mapStorageUploadError(
  message: string,
  statusCode?: string,
  kind: "pdf" | "image" = "image",
): string {
  return mapSupabaseStorageErrorMessage(message, statusCode, kind);
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
    logStorageUploadFailure("image", path, error);
    throw new Error(mapStorageUploadError(error.message || "Upload failed", error.statusCode, "image"));
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
    logStorageUploadFailure("document", path, error);
    throw new Error(mapStorageUploadError(error.message || "Upload failed", error.statusCode, "pdf"));
  }

  const url = getNewsletterAssetPublicUrl(path);
  if (!url) throw new Error("Upload failed. Could not build public URL.");
  return { url, path };
}
