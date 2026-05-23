/**
 * Browser prayer recording helpers (client-safe; no Node APIs).
 */

/** Video MIME types for MediaRecorder, in preference order (Safari: video/mp4). */
export const PRAYER_VIDEO_RECORDER_MIME_CANDIDATES = [
  "video/mp4",
  "video/mp4;codecs=avc1,mp4a",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
] as const;

/** Audio MIME types for MediaRecorder, in preference order. */
export const PRAYER_AUDIO_RECORDER_MIME_CANDIDATES = [
  "audio/mp4",
  "audio/mp4;codecs=mp4a",
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mpeg",
  "audio/wav",
] as const;

/** @deprecated Use {@link PRAYER_AUDIO_RECORDER_MIME_CANDIDATES}. */
export const PRAYER_AUDIO_RECORDER_MIME_CANDIDATES_LEGACY = PRAYER_AUDIO_RECORDER_MIME_CANDIDATES;

function pickFirstSupportedMime(candidates: readonly string[]): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const type of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(type)) return type;
    } catch {
      /* older WebKit */
    }
  }
  return undefined;
}

export function pickVideoRecorderMimeType(): string | undefined {
  return pickFirstSupportedMime(PRAYER_VIDEO_RECORDER_MIME_CANDIDATES);
}

export function pickAudioRecorderMimeType(): string | undefined {
  return pickFirstSupportedMime(PRAYER_AUDIO_RECORDER_MIME_CANDIDATES);
}

/** @deprecated Use {@link pickAudioRecorderMimeType}. */
export function pickRecorderMimeType(): string | undefined {
  return pickAudioRecorderMimeType();
}

export type PrayerRecordingMode = "audio" | "video";

export function pickRecorderMimeTypeForMode(mode: PrayerRecordingMode): string | undefined {
  return mode === "video" ? pickVideoRecorderMimeType() : pickAudioRecorderMimeType();
}

/** True when in-browser recording may be attempted (mic + MediaRecorder). */
export function supportsBrowserVoiceRecording(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof MediaRecorder === "undefined") return false;
  if (!navigator.mediaDevices?.getUserMedia) return false;
  return true;
}

/** True when camera + mic recording may be attempted. */
export function supportsBrowserVideoPrayerRecording(): boolean {
  return supportsBrowserVoiceRecording();
}

export function extensionFromRecorderBlob(
  blob: Blob,
  preferredMime?: string,
  mode: PrayerRecordingMode = "audio",
): string {
  const type = (blob.type || preferredMime || "").toLowerCase();
  if (type.startsWith("video/") || mode === "video") {
    if (type.includes("mp4")) return "mp4";
    return "webm";
  }
  if (type.includes("mp4") || type.includes("aac") || type.includes("m4a")) return "m4a";
  if (type.includes("mpeg") || type.includes("mp3")) return "mp3";
  if (type.includes("wav")) return "wav";
  if (type.includes("ogg")) return "ogg";
  return "webm";
}

export function recordingModeFromMime(mimeType: string): PrayerRecordingMode {
  return mimeType.split(";")[0]?.trim().toLowerCase().startsWith("video/")
    ? "video"
    : "audio";
}
