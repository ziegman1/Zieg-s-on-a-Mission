import { describe, expect, it } from "vitest";
import { prayerPlayerMediaElement, shouldUseVideoPrayerPlayer } from "./prayer-media-playback";

describe("prayer media playback", () => {
  it("uses video player when hasVideo is true", () => {
    expect(shouldUseVideoPrayerPlayer({ hasVideo: true, mimeType: "audio/mp4" })).toBe(
      true,
    );
  });

  it("uses video player for video/* MIME", () => {
    expect(shouldUseVideoPrayerPlayer({ mimeType: "video/mp4" })).toBe(true);
    expect(shouldUseVideoPrayerPlayer({ mimeType: "video/webm;codecs=vp9" })).toBe(
      true,
    );
  });

  it("uses audio player for audio-only MIME", () => {
    expect(shouldUseVideoPrayerPlayer({ mimeType: "audio/mp4", hasVideo: false })).toBe(
      false,
    );
    expect(shouldUseVideoPrayerPlayer({ mimeType: "audio/webm" })).toBe(false);
  });

  it("selects video vs audio element for player rendering", () => {
    expect(
      prayerPlayerMediaElement({ mimeType: "video/mp4", hasVideo: true }),
    ).toBe("video");
    expect(
      prayerPlayerMediaElement({ mimeType: "audio/mp4", hasVideo: false }),
    ).toBe("audio");
  });
});
