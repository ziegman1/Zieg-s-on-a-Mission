import { describe, expect, it } from "vitest";
import {
  isAllowedPrayerAudioFile,
  normalizePrayerAudioMime,
  validateCommunityPrayerAudioFile,
} from "./media-upload";

describe("prayer audio validation", () => {
  it("accepts iPhone .m4a with empty MIME", () => {
    const file = new File([new Uint8Array([1, 2, 3])], "prayer.m4a", { type: "" });
    expect(validateCommunityPrayerAudioFile(file)).toBeNull();
    expect(isAllowedPrayerAudioFile(file)).toBe(true);
  });

  it("normalizes video/quicktime to audio/mp4", () => {
    expect(normalizePrayerAudioMime("video/quicktime", "clip.m4a")).toBe("audio/mp4");
  });

  it("rejects unknown extensions", () => {
    const file = new File([new Uint8Array(10)], "notes.txt", { type: "text/plain" });
    expect(validateCommunityPrayerAudioFile(file)).toMatch(/MP3, M4A/);
  });
});
