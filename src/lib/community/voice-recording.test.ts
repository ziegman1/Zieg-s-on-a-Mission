import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  PRAYER_AUDIO_RECORDER_MIME_CANDIDATES,
  PRAYER_VIDEO_RECORDER_MIME_CANDIDATES,
  extensionFromRecorderBlob,
  pickAudioRecorderMimeType,
  pickRecorderMimeTypeForMode,
  pickVideoRecorderMimeType,
} from "./voice-recording";

describe("prayer recorder MIME fallback", () => {
  beforeEach(() => {
    class MockMediaRecorder {
      static isTypeSupported(type: string) {
        return (
          type === "video/mp4" ||
          type === "audio/mp4" ||
          type === "audio/webm;codecs=opus"
        );
      }
    }
    vi.stubGlobal("MediaRecorder", MockMediaRecorder);
  });

  it("prefers video/mp4 for video mode when supported (Safari-friendly)", () => {
    expect(pickVideoRecorderMimeType()).toBe("video/mp4");
    expect(pickRecorderMimeTypeForMode("video")).toBe("video/mp4");
  });

  it("prefers audio/mp4 for audio mode when supported", () => {
    expect(pickAudioRecorderMimeType()).toBe("audio/mp4");
    expect(pickRecorderMimeTypeForMode("audio")).toBe("audio/mp4");
  });

  it("lists candidates in required preference order", () => {
    expect(PRAYER_VIDEO_RECORDER_MIME_CANDIDATES[0]).toBe("video/mp4");
    expect(PRAYER_AUDIO_RECORDER_MIME_CANDIDATES[0]).toBe("audio/mp4");
  });

  it("maps video blob extension to mp4", () => {
    const blob = new Blob([], { type: "video/mp4" });
    expect(extensionFromRecorderBlob(blob, "video/mp4", "video")).toBe("mp4");
  });

  it("maps audio webm blob extension", () => {
    const blob = new Blob([], { type: "audio/webm" });
    expect(extensionFromRecorderBlob(blob, "audio/webm", "audio")).toBe("webm");
  });
});
