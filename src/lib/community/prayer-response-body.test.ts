import { describe, expect, it } from "vitest";
import {
  encodeVoicePrayerBody,
  parsePrayerResponseBody,
} from "./prayer-response-body";

describe("voice/video prayer body", () => {
  it("round-trips video metadata", () => {
    const body = encodeVoicePrayerBody({
      audioUrl: "https://cdn.example/prayer.mp4",
      durationSeconds: 42,
      mimeType: "video/mp4",
      filename: "video-prayer.mp4",
      hasVideo: true,
      originalFileName: "my-prayer.mp4",
    });
    const parsed = parsePrayerResponseBody(body);
    expect(parsed.kind).toBe("voice");
    if (parsed.kind !== "voice") return;
    expect(parsed.hasVideo).toBe(true);
    expect(parsed.mimeType).toBe("video/mp4");
    expect(parsed.originalFileName).toBe("my-prayer.mp4");
  });

  it("infers hasVideo from mime when flag omitted", () => {
    const body = encodeVoicePrayerBody({
      audioUrl: "https://cdn.example/prayer.mp4",
      mimeType: "video/mp4",
    });
    const parsed = parsePrayerResponseBody(body);
    expect(parsed.kind).toBe("voice");
    if (parsed.kind !== "voice") return;
    expect(parsed.hasVideo).toBe(true);
  });

  it("keeps audio prayers as non-video", () => {
    const body = encodeVoicePrayerBody({
      audioUrl: "https://cdn.example/voice.m4a",
      mimeType: "audio/mp4",
    });
    const parsed = parsePrayerResponseBody(body);
    expect(parsed.kind).toBe("voice");
    if (parsed.kind !== "voice") return;
    expect(parsed.hasVideo).toBe(false);
  });
});
