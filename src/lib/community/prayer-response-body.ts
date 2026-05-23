/** Prayer response payloads stored in `community_post_comments.body` (no schema migration). */

import { inferPrayerHasVideoFromMime } from "@/lib/community/prayer-media-playback";

const LEGACY_VOICE_MARKER = "__mhVoicePrayer";

export type VoicePrayerPayload = {
  kind: "voice_prayer";
  /** Public URL for audio or video prayer media. */
  audioUrl: string;
  durationSeconds?: number;
  mimeType?: string;
  filename?: string;
  hasVideo?: boolean;
  originalFileName?: string;
};

export type WrittenPrayerPayload = {
  kind: "written_prayer";
  text: string;
};

type LegacyVoicePayload = {
  [LEGACY_VOICE_MARKER]: true;
  audioUrl: string;
  caption?: string;
};

export type ParsedPrayerResponseBody =
  | {
      kind: "voice";
      audioUrl: string;
      durationSeconds: number | null;
      mimeType: string | null;
      filename: string | null;
      hasVideo: boolean;
      originalFileName: string | null;
      caption: string | null;
    }
  | { kind: "written"; text: string };

export function encodeVoicePrayerBody(input: {
  audioUrl: string;
  durationSeconds?: number;
  mimeType?: string;
  filename?: string;
  hasVideo?: boolean;
  originalFileName?: string;
}): string {
  const mime = input.mimeType?.trim() || undefined;
  const hasVideo =
    input.hasVideo === true ||
    (input.hasVideo !== false && Boolean(mime && inferPrayerHasVideoFromMime(mime)));

  const payload: VoicePrayerPayload = {
    kind: "voice_prayer",
    audioUrl: input.audioUrl.trim(),
    ...(typeof input.durationSeconds === "number" && input.durationSeconds >= 0
      ? { durationSeconds: Math.round(input.durationSeconds) }
      : {}),
    ...(mime ? { mimeType: mime } : {}),
    ...(input.filename?.trim() ? { filename: input.filename.trim() } : {}),
    ...(hasVideo ? { hasVideo: true } : {}),
    ...(input.originalFileName?.trim()
      ? { originalFileName: input.originalFileName.trim() }
      : {}),
  };
  return JSON.stringify(payload);
}

export function encodeWrittenPrayerBody(text: string): string {
  const trimmed = text.trim();
  const payload: WrittenPrayerPayload = { kind: "written_prayer", text: trimmed };
  return JSON.stringify(payload);
}

function parseLegacyVoice(parsed: Record<string, unknown>): ParsedPrayerResponseBody | null {
  if (
    parsed[LEGACY_VOICE_MARKER] === true &&
    typeof parsed.audioUrl === "string" &&
    parsed.audioUrl.trim()
  ) {
    return {
      kind: "voice",
      audioUrl: parsed.audioUrl.trim(),
      durationSeconds: null,
      mimeType: null,
      filename: null,
      hasVideo: false,
      originalFileName: null,
      caption: typeof parsed.caption === "string" ? parsed.caption.trim() || null : null,
    };
  }
  return null;
}

function parseCanonicalVoice(parsed: Record<string, unknown>): ParsedPrayerResponseBody | null {
  if (parsed.kind !== "voice_prayer") return null;
  if (typeof parsed.audioUrl !== "string" || !parsed.audioUrl.trim()) return null;
  const duration =
    typeof parsed.durationSeconds === "number" && Number.isFinite(parsed.durationSeconds)
      ? Math.max(0, Math.round(parsed.durationSeconds))
      : null;
  const mimeType =
    typeof parsed.mimeType === "string" ? parsed.mimeType.trim() || null : null;
  const hasVideoExplicit = parsed.hasVideo === true;
  const hasVideo =
    hasVideoExplicit ||
    (parsed.hasVideo !== false && inferPrayerHasVideoFromMime(mimeType));
  const originalFileName =
    typeof parsed.originalFileName === "string"
      ? parsed.originalFileName.trim() || null
      : null;

  return {
    kind: "voice",
    audioUrl: parsed.audioUrl.trim(),
    durationSeconds: duration,
    mimeType,
    filename: typeof parsed.filename === "string" ? parsed.filename.trim() || null : null,
    hasVideo,
    originalFileName,
    caption: null,
  };
}

function parseWrittenPrayer(parsed: Record<string, unknown>): ParsedPrayerResponseBody | null {
  if (parsed.kind !== "written_prayer") return null;
  if (typeof parsed.text !== "string" || !parsed.text.trim()) return null;
  return { kind: "written", text: parsed.text.trim() };
}

export function parsePrayerResponseBody(body: string): ParsedPrayerResponseBody {
  const trimmed = body.trim();
  if (!trimmed.startsWith("{")) {
    return { kind: "written", text: body };
  }
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    return (
      parseCanonicalVoice(parsed) ??
      parseLegacyVoice(parsed) ??
      parseWrittenPrayer(parsed) ?? { kind: "written", text: body }
    );
  } catch {
    return { kind: "written", text: body };
  }
}

export function isVoicePrayerBody(body: string): boolean {
  return parsePrayerResponseBody(body).kind === "voice";
}

/** Human-readable excerpt for notifications and admin lists. */
export function prayerResponseNotificationExcerpt(body: string): string {
  const parsed = parsePrayerResponseBody(body);
  if (parsed.kind === "voice") return "Voice prayer";
  const text = parsed.text.trim();
  return text.length > 0 ? text : "Prayer";
}

export function formatPrayerDuration(seconds: number | null | undefined): string | null {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 1) return null;
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
