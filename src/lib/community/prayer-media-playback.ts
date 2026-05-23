/** Whether a stored prayer should use the video player (vs audio-only). */

export function shouldUseVideoPrayerPlayer(input: {
  mimeType?: string | null;
  hasVideo?: boolean | null;
}): boolean {
  if (input.hasVideo === true) return true;
  const mime = (input.mimeType ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
  return mime.startsWith("video/");
}

export function inferPrayerHasVideoFromMime(mimeType?: string | null): boolean {
  return shouldUseVideoPrayerPlayer({ mimeType, hasVideo: null });
}

/** HTML media element used in {@link CommunityVoicePrayerPlayer}. */
export function prayerPlayerMediaElement(
  input: Parameters<typeof shouldUseVideoPrayerPlayer>[0],
): "video" | "audio" {
  return shouldUseVideoPrayerPlayer(input) ? "video" : "audio";
}
