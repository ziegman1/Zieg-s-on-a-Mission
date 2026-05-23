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

/** Max in-browser recording length for voice prayers. */
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

export type CommunityPrayerAudioMimeType = (typeof COMMUNITY_PRAYER_AUDIO_TYPES)[number];

export const COMMUNITY_PRAYER_AUDIO_EXTENSIONS = [
  "mp3",
  "m4a",
  "webm",
  "wav",
  "aac",
  "ogg",
] as const;

const AUDIO_EXT_BY_MIME: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/x-m4a": "m4a",
  "audio/m4a": "m4a",
  "audio/aac": "aac",
};

/** iOS / mobile browsers sometimes report video/* for .m4a uploads. */
const PRAYER_AUDIO_MIME_ALIASES: Record<string, string> = {
  "video/mp4": "audio/mp4",
  "video/quicktime": "audio/mp4",
  "audio/x-m4a": "audio/mp4",
  "audio/m4a": "audio/mp4",
};

export function guessAudioMimeFromName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    webm: "audio/webm",
    wav: "audio/wav",
    aac: "audio/aac",
    ogg: "audio/ogg",
  };
  return ext ? (map[ext] ?? "") : "";
}

/** Strip codec parameters and map mobile aliases to canonical prayer audio MIME. */
export function normalizePrayerAudioMime(type: string, filename?: string): string {
  const raw = (type || "").split(";")[0]?.trim().toLowerCase() ?? "";
  const aliased = PRAYER_AUDIO_MIME_ALIASES[raw] ?? raw;
  if (aliased && isCommunityPrayerAudioMimeType(aliased)) return aliased;
  const fromName = guessAudioMimeFromName(filename ?? "");
  return fromName || aliased;
}

export function isCommunityPrayerAudioMimeType(type: string): type is CommunityPrayerAudioMimeType {
  const base = type.split(";")[0]?.trim().toLowerCase() ?? "";
  const normalized = PRAYER_AUDIO_MIME_ALIASES[base] ?? base;
  return (COMMUNITY_PRAYER_AUDIO_TYPES as readonly string[]).includes(normalized);
}

export function isAllowedPrayerAudioExtension(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return (COMMUNITY_PRAYER_AUDIO_EXTENSIONS as readonly string[]).includes(ext);
}

export function isAllowedPrayerAudioFile(file: File): boolean {
  if (file.size < 1) return false;
  const mime = normalizePrayerAudioMime(file.type, file.name);
  if (mime && isCommunityPrayerAudioMimeType(mime)) return true;
  return isAllowedPrayerAudioExtension(file.name);
}

export function extensionForPrayerAudioMime(type: string): string {
  const normalized = normalizePrayerAudioMime(type);
  return AUDIO_EXT_BY_MIME[normalized] ?? "webm";
}

export function validateCommunityPrayerAudioFile(file: File): string | null {
  if (file.size > COMMUNITY_PRAYER_AUDIO_MAX_BYTES) {
    return "Audio must be 10 MB or smaller.";
  }
  if (file.size < 1) {
    return "Audio file is empty.";
  }
  if (!isAllowedPrayerAudioFile(file)) {
    return "Use MP3, M4A, WebM, WAV, or AAC audio.";
  }
  return null;
}

/** Build a File with a normalized MIME for upload validation and storage. */
export function prayerAudioFileFromBlob(
  blob: Blob,
  filename: string,
): File {
  const mime = normalizePrayerAudioMime(blob.type, filename) || guessAudioMimeFromName(filename) || "audio/webm";
  return new File([blob], filename, { type: mime });
}

/** `blog/2026/05/<uuid>.jpg` */
export function buildBlogFeaturedImagePath(ext: string): string {
  return buildCommunityMediaPath("blog", ext);
}

export const NEWSLETTER_IMAGE_PURPOSES = ["header", "featured", "footer", "block"] as const;
export type NewsletterImagePurpose = (typeof NEWSLETTER_IMAGE_PURPOSES)[number];

/** `newsletters/{purpose}/2026/05/<uuid>.jpg` */
export function buildNewsletterImagePath(purpose: NewsletterImagePurpose, ext: string): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const id = crypto.randomUUID();
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
  const safePurpose = NEWSLETTER_IMAGE_PURPOSES.includes(purpose) ? purpose : "block";
  return `newsletters/${safePurpose}/${y}/${m}/${id}.${safeExt}`;
}

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
