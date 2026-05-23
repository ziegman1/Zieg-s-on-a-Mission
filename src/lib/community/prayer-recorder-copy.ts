/**
 * Single source of truth for Mission Hub prayer recorder / modal UI copy.
 * Imported by forms, recorder, presets, and validation — keep in sync.
 */

/** Build marker — inspect in devtools: `[data-prayer-recorder-version]` */
export const PRAYER_RECORDER_VERSION = "mp4-video-v1";

export const PRAYER_RECORDER_COPY = {
  voiceVideoTabLabel: "Voice / Video Prayer",
  submitShare: "Share Prayer",
  uploadHelper:
    "Upload audio or video file (MP3, M4A, WebM, WAV, AAC, MP4…)",
  validationMessage: "Use MP3, M4A, WebM, WAV, AAC, or MP4.",
  readyHint: "Prayer ready — tap Share Prayer when you are ready.",
  startRecordingAudio: "Start recording",
  startRecordingVideo: "Start video recording",
  recordOrUploadFirst: "Record or upload a voice or video prayer first.",
  uploadFileInstead: "Upload a file instead",
  browserNoRecord: "Recording is not supported in this browser. You can upload a file instead.",
  playerVoiceLabel: "Voice / Video Prayer",
  playerVideoLabel: "Video Prayer",
  participationSectionVoice: "Voice / Video",
} as const;
