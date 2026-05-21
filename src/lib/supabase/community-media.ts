import { createClient } from "@supabase/supabase-js";
import {
  buildCommunityMemberProfilePath,
  buildCommunityPostCoverPath,
  buildCommunityPrayerAudioPath,
  buildCommunitySpaceCoverPath,
  extensionForCoverMime,
  extensionForPrayerAudioMime,
  type CommunityCoverMimeType,
} from "@/lib/community/media-upload";
import {
  assertSupabaseStorageReady,
  COMMUNITY_MEDIA_BUCKET,
  getSupabaseProjectUrl,
  getSupabaseServiceRoleKey,
  supabaseServiceRoleKeyErrorMessage,
} from "@/lib/supabase/config";

function getStorageAdmin() {
  assertSupabaseStorageReady();
  const url = getSupabaseProjectUrl()!;
  const key = getSupabaseServiceRoleKey()!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getCommunityMediaPublicUrl(storagePath: string): string | null {
  const base = getSupabaseProjectUrl();
  if (!base) return null;
  const encoded = storagePath
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return `${base}/storage/v1/object/public/${COMMUNITY_MEDIA_BUCKET}/${encoded}`;
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
    return (
      "Supabase rejected SUPABASE_SERVICE_ROLE_KEY (invalid or revoked). " +
      "Re-copy the legacy service_role JWT from Dashboard → Settings → API Keys → Legacy API Keys."
    );
  }
  if (lower.includes("forbidden") || lower.includes("permission denied")) {
    return (
      "Supabase Storage denied this upload (forbidden). " +
      "Confirm the community-media bucket exists and the service_role key matches this project."
    );
  }
  return message || "Upload failed";
}

/**
 * Upload post cover bytes to Supabase Storage. Returns public HTTPS URL for `cover_image_url`.
 */
export async function uploadCommunityPostCover(
  bytes: Buffer,
  contentType: CommunityCoverMimeType,
): Promise<{ url: string; path: string }> {
  const supabase = getStorageAdmin();

  const ext = extensionForCoverMime(contentType);
  const path = buildCommunityPostCoverPath(ext);

  const { error } = await supabase.storage.from(COMMUNITY_MEDIA_BUCKET).upload(path, bytes, {
    contentType,
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    if (error.message?.toLowerCase().includes("bucket") || error.message?.includes("not found")) {
      throw new Error(
        `Storage bucket "${COMMUNITY_MEDIA_BUCKET}" is missing. Create it in Supabase (see docs/supabase-community-media.md).`,
      );
    }
    throw new Error(mapStorageUploadError(error.message || "Upload failed"));
  }

  const url = getCommunityMediaPublicUrl(path);
  if (!url) throw new Error("Could not build public URL for uploaded image.");
  return { url, path };
}

/** Upload space cover bytes to Supabase Storage. */
export async function uploadCommunitySpaceCover(
  bytes: Buffer,
  contentType: CommunityCoverMimeType,
): Promise<{ url: string; path: string }> {
  const supabase = getStorageAdmin();

  const ext = extensionForCoverMime(contentType);
  const path = buildCommunitySpaceCoverPath(ext);

  const { error } = await supabase.storage.from(COMMUNITY_MEDIA_BUCKET).upload(path, bytes, {
    contentType,
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    if (error.message?.toLowerCase().includes("bucket") || error.message?.includes("not found")) {
      throw new Error(
        `Storage bucket "${COMMUNITY_MEDIA_BUCKET}" is missing. Create it in Supabase (see docs/supabase-community-media.md).`,
      );
    }
    throw new Error(mapStorageUploadError(error.message || "Upload failed"));
  }

  const url = getCommunityMediaPublicUrl(path);
  if (!url) throw new Error("Could not build public URL for uploaded image.");
  return { url, path };
}

/** Upload member profile photo bytes to Supabase Storage. */
export async function uploadCommunityMemberProfile(
  bytes: Buffer,
  contentType: CommunityCoverMimeType,
): Promise<{ url: string; path: string }> {
  const supabase = getStorageAdmin();

  const ext = extensionForCoverMime(contentType);
  const path = buildCommunityMemberProfilePath(ext);

  const { error } = await supabase.storage.from(COMMUNITY_MEDIA_BUCKET).upload(path, bytes, {
    contentType,
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    if (error.message?.toLowerCase().includes("bucket") || error.message?.includes("not found")) {
      throw new Error(
        `Storage bucket "${COMMUNITY_MEDIA_BUCKET}" is missing. Create it in Supabase (see docs/supabase-community-media.md).`,
      );
    }
    throw new Error(mapStorageUploadError(error.message || "Upload failed"));
  }

  const url = getCommunityMediaPublicUrl(path);
  if (!url) throw new Error("Could not build public URL for uploaded image.");
  return { url, path };
}

/** Upload voice prayer audio to Supabase Storage. */
export async function uploadCommunityPrayerAudio(
  bytes: Buffer,
  contentType: string,
): Promise<{ url: string; path: string }> {
  const supabase = getStorageAdmin();
  const ext = extensionForPrayerAudioMime(contentType);
  const path = buildCommunityPrayerAudioPath(ext);

  const { error } = await supabase.storage.from(COMMUNITY_MEDIA_BUCKET).upload(path, bytes, {
    contentType,
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    if (error.message?.toLowerCase().includes("bucket") || error.message?.includes("not found")) {
      throw new Error(
        `Storage bucket "${COMMUNITY_MEDIA_BUCKET}" is missing. Create it in Supabase (see docs/supabase-community-media.md).`,
      );
    }
    throw new Error(mapStorageUploadError(error.message || "Upload failed"));
  }

  const url = getCommunityMediaPublicUrl(path);
  if (!url) throw new Error("Could not build public URL for uploaded audio.");
  return { url, path };
}
