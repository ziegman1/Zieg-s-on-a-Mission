/**
 * Browser voice recording helpers (client-safe; no Node APIs).
 */

/** MIME types to try for MediaRecorder, in preference order. */
export const PRAYER_AUDIO_RECORDER_MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/mp4;codecs=mp4a",
  "audio/aac",
  "audio/ogg;codecs=opus",
  "audio/wav",
] as const;

export function pickRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const type of PRAYER_AUDIO_RECORDER_MIME_CANDIDATES) {
    try {
      if (MediaRecorder.isTypeSupported(type)) return type;
    } catch {
      /* older WebKit */
    }
  }
  return undefined;
}

/** True when in-browser recording may be attempted (mic + MediaRecorder). */
export function supportsBrowserVoiceRecording(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof MediaRecorder === "undefined") return false;
  if (!navigator.mediaDevices?.getUserMedia) return false;
  return true;
}

export function extensionFromRecorderBlob(blob: Blob, preferredMime?: string): string {
  const type = (blob.type || preferredMime || "").toLowerCase();
  if (type.includes("mp4") || type.includes("aac") || type.includes("m4a")) return "m4a";
  if (type.includes("mpeg") || type.includes("mp3")) return "mp3";
  if (type.includes("wav")) return "wav";
  if (type.includes("ogg")) return "ogg";
  return "webm";
}
