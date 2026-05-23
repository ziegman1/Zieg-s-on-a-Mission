import { describe, expect, it } from "vitest";
import {
  isAllowedPrayerMediaFile,
  isPrayerVideoMimeType,
  normalizePrayerMediaMime,
  PRAYER_MEDIA_VALIDATION_MESSAGE,
  validateCommunityPrayerMediaFile,
} from "./media-upload";

describe("prayer media validation", () => {
  it("accepts iPhone .m4a with empty MIME", () => {
    const file = new File([new Uint8Array([1, 2, 3])], "prayer.m4a", { type: "" });
    expect(validateCommunityPrayerMediaFile(file)).toBeNull();
    expect(isAllowedPrayerMediaFile(file)).toBe(true);
  });

  it("accepts MP4 upload by extension", () => {
    const file = new File([new Uint8Array(10)], "prayer.mp4", { type: "" });
    expect(validateCommunityPrayerMediaFile(file)).toBeNull();
    expect(normalizePrayerMediaMime("", "prayer.mp4")).toBe("video/mp4");
  });

  it("accepts video/mp4 MIME", () => {
    const file = new File([new Uint8Array(10)], "clip.mp4", { type: "video/mp4" });
    expect(validateCommunityPrayerMediaFile(file)).toBeNull();
    expect(isPrayerVideoMimeType("video/mp4")).toBe(true);
    expect(normalizePrayerMediaMime("video/mp4")).toBe("video/mp4");
  });

  it("keeps audio/mp4 distinct from video/mp4", () => {
    expect(normalizePrayerMediaMime("audio/mp4", "voice.m4a")).toBe("audio/mp4");
    expect(normalizePrayerMediaMime("video/mp4", "prayer.mp4")).toBe("video/mp4");
  });

  it("normalizes video/quicktime to audio/mp4 for m4a extension (Safari voice)", () => {
    expect(normalizePrayerMediaMime("video/quicktime", "clip.m4a")).toBe("audio/mp4");
  });

  it("normalizes video/quicktime to video/mp4 for .mp4 extension", () => {
    expect(normalizePrayerMediaMime("video/quicktime", "clip.mp4")).toBe("video/mp4");
  });

  it("rejects unknown extensions with updated message", () => {
    const file = new File([new Uint8Array(10)], "notes.txt", { type: "text/plain" });
    expect(validateCommunityPrayerMediaFile(file)).toBe(PRAYER_MEDIA_VALIDATION_MESSAGE);
  });
});
