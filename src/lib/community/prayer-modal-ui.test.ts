import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getSpaceInteractionPreset } from "@/lib/community/space-interaction";
import { PRAYER_MEDIA_VALIDATION_MESSAGE } from "@/lib/community/media-upload";
import {
  PRAYER_RECORDER_COPY,
  PRAYER_RECORDER_VERSION,
} from "@/lib/community/prayer-recorder-copy";

const ROOT = join(import.meta.dirname, "../..");

/** Every surface that renders the prayer recorder modal must use shared copy. */
/** Files that must wire shared copy directly (wrappers delegate to these). */
const PRAYER_MODAL_SOURCE_FILES = [
  "components/community/community-prayer-response-form.tsx",
  "components/community/community-voice-prayer-recorder.tsx",
  "components/community/community-prayer-room-post-form.tsx",
  "components/community/community-prayer-room-participation-picker.tsx",
  "components/community/community-voice-prayer-player.tsx",
  "lib/community/space-interaction.ts",
  "lib/community/prayer-room-composer.ts",
  "lib/community/media-upload.ts",
] as const;

const FORBIDDEN_LEGACY_STRINGS = [
  "Voice Prayer",
  "Share Voice Prayer",
  "Use MP3, M4A, WebM, WAV, or AAC audio.",
  "Upload audio (MP3, M4A, WebM, WAV, AAC)",
] as const;

describe("prayer modal UI copy (production surfaces)", () => {
  it("exposes build marker version for verification", () => {
    expect(PRAYER_RECORDER_VERSION).toBe("mp4-video-v1");
    expect(PRAYER_RECORDER_COPY.voiceVideoTabLabel).toBe("Voice / Video Prayer");
    expect(PRAYER_RECORDER_COPY.uploadHelper).toContain("MP4");
    expect(PRAYER_MEDIA_VALIDATION_MESSAGE).toContain("MP4");
  });

  it("keeps prayer preset labels aligned with recorder copy", () => {
    const preset = getSpaceInteractionPreset("prayer");
    expect(preset.comments.composerVoiceLabel).toBe(
      PRAYER_RECORDER_COPY.voiceVideoTabLabel,
    );
    expect(preset.comments.submitVoice).toBe(PRAYER_RECORDER_COPY.submitShare);
  });

  it("modal source files import shared copy and omit legacy strings", () => {
    for (const rel of PRAYER_MODAL_SOURCE_FILES) {
      const src = readFileSync(join(ROOT, rel), "utf8");
      expect(src, rel).toMatch(/prayer-recorder-copy/);
      for (const forbidden of FORBIDDEN_LEGACY_STRINGS) {
        expect(src, `${rel} must not contain "${forbidden}"`).not.toContain(forbidden);
      }
    }
  });

  it("recorder component sets data-prayer-recorder-version", () => {
    const recorder = readFileSync(
      join(ROOT, "components/community/community-voice-prayer-recorder.tsx"),
      "utf8",
    );
    expect(recorder).toContain("data-prayer-recorder-version");
    expect(recorder).toContain("PRAYER_RECORDER_VERSION");
    expect(recorder).toContain("PRAYER_RECORDER_COPY.uploadHelper");
  });
});
