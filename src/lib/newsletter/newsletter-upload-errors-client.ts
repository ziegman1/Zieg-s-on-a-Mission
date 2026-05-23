import { supabaseServiceRoleKeyErrorMessage } from "@/lib/supabase/config-env";

export type NewsletterUploadKind = "pdf" | "image";

export type NewsletterUploadErrorBody = {
  error: string;
  /** Raw / technical detail — development responses only. */
  detail?: string;
};

/** Map Supabase Storage API errors to user-facing messages. */
export function mapSupabaseStorageErrorMessage(
  message: string,
  statusCode?: string | number,
  kind: NewsletterUploadKind = "pdf",
): string {
  const lower = message.toLowerCase();
  const code = String(statusCode ?? "");

  if (
    code === "404" ||
    lower.includes("bucket not found") ||
    (lower.includes("bucket") && lower.includes("not found"))
  ) {
    return "Storage bucket not configured. Create the newsletter-assets bucket in Supabase (see docs/supabase-newsletter-assets.md).";
  }

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

  if (
    lower.includes("unauthorized") ||
    lower.includes("invalid api key") ||
    code === "401"
  ) {
    return "You are not authorized to upload. Check SUPABASE_SERVICE_ROLE_KEY (legacy service_role JWT).";
  }

  if (
    lower.includes("forbidden") ||
    lower.includes("permission denied") ||
    lower.includes("row-level security") ||
    code === "403"
  ) {
    return "Supabase Storage policy rejected upload. Run supabase/storage/newsletter-assets-policies.sql in the Supabase SQL Editor.";
  }

  if (
    lower.includes("payload too large") ||
    lower.includes("file size") ||
    lower.includes("too large") ||
    code === "413"
  ) {
    return kind === "pdf" ? "PDF exceeds 20 MB." : "Image exceeds size limit.";
  }

  if (
    lower.includes("mime") ||
    lower.includes("not allowed") ||
    lower.includes("not supported") ||
    (lower.includes("invalid") && lower.includes("type"))
  ) {
    return kind === "pdf"
      ? "PDF type not allowed on the storage bucket. Run supabase/storage/newsletter-assets-policies.sql to allow application/pdf."
      : "Unsupported file type for the storage bucket.";
  }

  if (lower.includes("duplicate") || lower.includes("already exists")) {
    return "Upload conflict. Try again.";
  }

  if (lower.includes("not configured") || lower.includes("missing next_public")) {
    return message;
  }

  if (lower.includes("could not build public url")) {
    return "Upload failed: missing NEXT_PUBLIC_SUPABASE_URL for public file URLs.";
  }

  return message.trim() || "Unknown storage error.";
}

/** Map thrown Error messages from upload pipeline. */
export function mapNewsletterUploadErrorMessage(
  raw: string,
  kind: NewsletterUploadKind = "pdf",
): string {
  const lower = raw.toLowerCase();

  if (lower.includes("storage bucket") && lower.includes("missing")) {
    return raw;
  }
  if (lower.includes("not configured") || lower.includes("missing next_public")) {
    return raw;
  }
  if (lower.includes("20 mb") || (kind === "pdf" && lower.includes("size limit"))) {
    return kind === "pdf" ? "PDF exceeds 20 MB." : "Image exceeds size limit.";
  }
  if (lower.includes("use a pdf")) {
    return "Use a PDF file.";
  }

  return mapSupabaseStorageErrorMessage(raw, undefined, kind);
}

export const UNAUTHORIZED_UPLOAD_MESSAGE =
  "You are not authorized to upload. Sign in as an admin.";

/** Parse upload API JSON for client-side display. */
export function parseNewsletterUploadApiError(
  status: number,
  data: { error?: string; detail?: string } | null,
  kind: NewsletterUploadKind = "pdf",
): string {
  if (status === 401) {
    return UNAUTHORIZED_UPLOAD_MESSAGE;
  }
  if (data?.error) {
    if (process.env.NODE_ENV === "development" && data.detail) {
      return `${data.error} (${data.detail})`;
    }
    return data.error;
  }
  if (status === 503) {
    return "Storage not configured.";
  }
  return `Upload failed (HTTP ${status}).`;
}
