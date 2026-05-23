import "server-only";

import {
  getSupabaseStorageConfigProblems,
  supabaseStorageNotConfiguredMessage,
} from "@/lib/supabase/config-env";
import {
  mapNewsletterUploadErrorMessage,
  type NewsletterUploadErrorBody,
  type NewsletterUploadKind,
} from "@/lib/newsletter/newsletter-upload-errors-client";

export function formatNewsletterUploadErrorBody(
  raw: string,
  kind: NewsletterUploadKind = "pdf",
): NewsletterUploadErrorBody {
  const friendly = mapNewsletterUploadErrorMessage(raw, kind);
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    return {
      error: `Upload failed: ${friendly}`,
      detail: raw !== friendly ? raw : undefined,
    };
  }

  return { error: friendly };
}

export function storageConfigErrorBody(): NewsletterUploadErrorBody {
  let error = supabaseStorageNotConfiguredMessage(getSupabaseStorageConfigProblems());
  if (process.env.NODE_ENV === "development") {
    error = `Upload failed: ${error} Add values to .env.local and restart npm run dev.`;
  }
  return { error };
}
