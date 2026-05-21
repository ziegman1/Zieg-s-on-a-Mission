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
  "audio/aac",
] as const;

export type CommunityPrayerAudioMimeType = (typeof COMMUNITY_PRAYER_AUDIO_TYPES)[number];

const AUDIO_EXT_BY_MIME: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
};

export function isCommunityPrayerAudioMimeType(type: string): type is CommunityPrayerAudioMimeType {
  return (COMMUNITY_PRAYER_AUDIO_TYPES as readonly string[]).includes(type);
}

export function extensionForPrayerAudioMime(type: string): string {
  return AUDIO_EXT_BY_MIME[type] ?? "webm";
}

export function validateCommunityPrayerAudioFile(file: File): string | null {
  if (file.size > COMMUNITY_PRAYER_AUDIO_MAX_BYTES) {
    return "Audio must be 10 MB or smaller.";
  }
  const type = file.type || guessAudioMimeFromName(file.name);
  if (!type || !isCommunityPrayerAudioMimeType(type)) {
    return "Use MP3, M4A, WebM, WAV, or AAC audio.";
  }
  return null;
}

function guessAudioMimeFromName(name: string): string {
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

function buildCommunityMediaPath(
  folder: "posts" | "profiles" | "spaces" | "prayers",
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
