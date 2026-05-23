/** Mission Hub post cover uploads — Supabase Storage `community-media` bucket */

export const COMMUNITY_COVER_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export const COMMUNITY_COVER_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type CommunityCoverMimeType = (typeof COMMUNITY_COVER_ALLOWED_TYPES)[number];

const EXT_BY_MIME: Record<CommunityCoverMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function isCommunityCoverMimeType(type: string): type is CommunityCoverMimeType {
  return (COMMUNITY_COVER_ALLOWED_TYPES as readonly string[]).includes(type);
}

export function extensionForCoverMime(type: CommunityCoverMimeType): string {
  return EXT_BY_MIME[type];
}

/** `posts/2026/05/<uuid>.jpg` */
export function buildCommunityPostCoverPath(ext: string): string {
  return buildCommunityMediaPath("posts", ext);
}

/** `profiles/2026/05/<uuid>.jpg` */
export function buildCommunityMemberProfilePath(ext: string): string {
  return buildCommunityMediaPath("profiles", ext);
}

/** `spaces/2026/05/<uuid>.jpg` */
export function buildCommunitySpaceCoverPath(ext: string): string {
  return buildCommunityMediaPath("spaces", ext);
}

/** `prayers/2026/05/<uuid>.webm` */
export function buildCommunityPrayerAudioPath(ext: string): string {
  return buildCommunityMediaPath("prayers", ext);
}

export const COMMUNITY_PRAYER_AUDIO_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/** Short video prayers (camera recordings / MP4 uploads). */
export const COMMUNITY_PRAYER_VIDEO_MAX_BYTES = 25 * 1024 * 1024; // 25 MB

/** Max in-browser recording length for voice/video prayers. */
export const COMMUNITY_PRAYER_AUDIO_MAX_DURATION_SECONDS = 180;

export const COMMUNITY_PRAYER_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/webm",
  "audio/ogg",
  "audio/wav",
  "audio/x-m4a",
  "audio/m4a",
  "audio/aac",
] as const;

export const COMMUNITY_PRAYER_VIDEO_TYPES = ["video/mp4", "video/webm"] as const;

export const COMMUNITY_PRAYER_MEDIA_TYPES = [
  ...COMMUNITY_PRAYER_AUDIO_TYPES,
  ...COMMUNITY_PRAYER_VIDEO_TYPES,
] as const;

export type CommunityPrayerAudioMimeType = (typeof COMMUNITY_PRAYER_AUDIO_TYPES)[number];
export type CommunityPrayerVideoMimeType = (typeof COMMUNITY_PRAYER_VIDEO_TYPES)[number];
export type CommunityPrayerMediaMimeType = (typeof COMMUNITY_PRAYER_MEDIA_TYPES)[number];

export const COMMUNITY_PRAYER_AUDIO_EXTENSIONS = [
  "mp3",
  "m4a",
  "webm",
  "wav",
  "aac",
  "ogg",
] as const;

export const COMMUNITY_PRAYER_MEDIA_EXTENSIONS = [
  ...COMMUNITY_PRAYER_AUDIO_EXTENSIONS,
  "mp4",
] as const;

export const PRAYER_MEDIA_VALIDATION_MESSAGE =
  "Use MP3, M4A, WebM, WAV, AAC, or MP4.";

const MEDIA_EXT_BY_MIME: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/x-m4a": "m4a",
  "audio/m4a": "m4a",
  "audio/aac": "aac",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

/** Audio-only aliases (do not map video/mp4 — needed for video prayers). */
const PRAYER_AUDIO_MIME_ALIASES: Record<string, string> = {
  "audio/x-m4a": "audio/mp4",
  "audio/m4a": "audio/mp4",
};

export function guessPrayerMediaMimeFromName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    webm: "audio/webm",
    wav: "audio/wav",
    aac: "audio/aac",
    ogg: "audio/ogg",
    mp4: "video/mp4",
  };
  return ext ? (map[ext] ?? "") : "";
}

/** @deprecated Use {@link guessPrayerMediaMimeFromName}. */
export const guessAudioMimeFromName = guessPrayerMediaMimeFromName;

/**
 * Normalize prayer media MIME (strip codecs; map audio aliases).
 * `video/quicktime` + `.m4a` → audio/mp4 (iOS voice memos); `.mp4` → video/mp4.
 */
export function normalizePrayerMediaMime(type: string, filename?: string): string {
  const raw = (type || "").split(";")[0]?.trim().toLowerCase() ?? "";
  const ext = filename?.split(".").pop()?.toLowerCase() ?? "";

  if (raw === "video/quicktime") {
    if (ext === "m4a" || ext === "aac") return "audio/mp4";
    if (ext === "mp3") return "audio/mpeg";
    if (ext === "mp4") return "video/mp4";
    return "audio/mp4";
  }

  if (raw && isCommunityPrayerMediaMimeType(raw)) return raw;

  const aliased = PRAYER_AUDIO_MIME_ALIASES[raw] ?? raw;
  if (aliased && isCommunityPrayerMediaMimeType(aliased)) return aliased;

  const fromName = guessPrayerMediaMimeFromName(filename ?? "");
  return fromName || aliased;
}

/** @deprecated Use {@link normalizePrayerMediaMime}. */
export function normalizePrayerAudioMime(type: string, filename?: string): string {
  return normalizePrayerMediaMime(type, filename);
}

export function isCommunityPrayerAudioMimeType(type: string): type is CommunityPrayerAudioMimeType {
  const base = type.split(";")[0]?.trim().toLowerCase() ?? "";
  const normalized = PRAYER_AUDIO_MIME_ALIASES[base] ?? base;
  return (COMMUNITY_PRAYER_AUDIO_TYPES as readonly string[]).includes(normalized);
}

export function isCommunityPrayerVideoMimeType(type: string): type is CommunityPrayerVideoMimeType {
  const base = type.split(";")[0]?.trim().toLowerCase() ?? "";
  return (COMMUNITY_PRAYER_VIDEO_TYPES as readonly string[]).includes(base);
}

export function isCommunityPrayerMediaMimeType(
  type: string,
): type is CommunityPrayerMediaMimeType {
  const base = type.split(";")[0]?.trim().toLowerCase() ?? "";
  if (isCommunityPrayerVideoMimeType(base)) return true;
  const normalized = PRAYER_AUDIO_MIME_ALIASES[base] ?? base;
  return (COMMUNITY_PRAYER_AUDIO_TYPES as readonly string[]).includes(normalized);
}

export function isPrayerVideoMimeType(type: string): boolean {
  const normalized = normalizePrayerMediaMime(type);
  return isCommunityPrayerVideoMimeType(normalized);
}

export function isAllowedPrayerMediaExtension(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return (COMMUNITY_PRAYER_MEDIA_EXTENSIONS as readonly string[]).includes(ext);
}

/** @deprecated Use {@link isAllowedPrayerMediaExtension}. */
export function isAllowedPrayerAudioExtension(filename: string): boolean {
  return isAllowedPrayerMediaExtension(filename);
}

export function isAllowedPrayerMediaFile(file: File): boolean {
  if (file.size < 1) return false;
  const mime = normalizePrayerMediaMime(file.type, file.name);
  if (mime && isCommunityPrayerMediaMimeType(mime)) return true;
  return isAllowedPrayerMediaExtension(file.name);
}

/** @deprecated Use {@link isAllowedPrayerMediaFile}. */
export const isAllowedPrayerAudioFile = isAllowedPrayerMediaFile;

export function extensionForPrayerMediaMime(type: string): string {
  const normalized = normalizePrayerMediaMime(type);
  return MEDIA_EXT_BY_MIME[normalized] ?? "webm";
}

/** @deprecated Use {@link extensionForPrayerMediaMime}. */
export const extensionForPrayerAudioMime = extensionForPrayerMediaMime;

export function maxBytesForPrayerMediaMime(type: string): number {
  return isPrayerVideoMimeType(type)
    ? COMMUNITY_PRAYER_VIDEO_MAX_BYTES
    : COMMUNITY_PRAYER_AUDIO_MAX_BYTES;
}

export function validateCommunityPrayerMediaFile(file: File): string | null {
  const mime = normalizePrayerMediaMime(file.type, file.name);
  const maxBytes = mime ? maxBytesForPrayerMediaMime(mime) : COMMUNITY_PRAYER_AUDIO_MAX_BYTES;

  if (file.size > maxBytes) {
    return isPrayerVideoMimeType(mime || file.type)
      ? "Video must be 25 MB or smaller."
      : "Audio must be 10 MB or smaller.";
  }
  if (file.size < 1) {
    return "File is empty.";
  }
  if (!isAllowedPrayerMediaFile(file)) {
    return PRAYER_MEDIA_VALIDATION_MESSAGE;
  }
  return null;
}

/** @deprecated Use {@link validateCommunityPrayerMediaFile}. */
export const validateCommunityPrayerAudioFile = validateCommunityPrayerMediaFile;

/** Build a File with a normalized MIME for upload validation and storage. */
export function prayerMediaFileFromBlob(blob: Blob, filename: string): File {
  const mime =
    normalizePrayerMediaMime(blob.type, filename) ||
    guessPrayerMediaMimeFromName(filename) ||
    "audio/webm";
  return new File([blob], filename, { type: mime });
}

/** @deprecated Use {@link prayerMediaFileFromBlob}. */
export const prayerAudioFileFromBlob = prayerMediaFileFromBlob;

export function inferPrayerMediaHasVideo(file: File): boolean {
  const mime = normalizePrayerMediaMime(file.type, file.name);
  return isPrayerVideoMimeType(mime);
}

/** `blog/2026/05/<uuid>.jpg` */
export function buildBlogFeaturedImagePath(ext: string): string {
  return buildCommunityMediaPath("blog", ext);
}

export {
  NEWSLETTER_IMAGE_PURPOSES,
  type NewsletterImagePurpose,
  buildNewsletterAssetPath as buildNewsletterImagePath,
} from "@/lib/newsletter/storage-paths";

function buildCommunityMediaPath(
  folder: "posts" | "profiles" | "spaces" | "prayers" | "blog",
  ext: string,
): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const id = crypto.randomUUID();
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
  return `${folder}/${y}/${m}/${id}.${safeExt}`;
}

export function validateCommunityCoverFile(file: File): string | null {
  if (file.size > COMMUNITY_COVER_MAX_BYTES) {
    return "Image must be 5 MB or smaller.";
  }
  if (!isCommunityCoverMimeType(file.type)) {
    return "Use a JPG, PNG, or WebP image.";
  }
  return null;
}
