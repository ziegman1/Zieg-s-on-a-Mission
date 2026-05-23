"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2,
  Mic,
  RotateCcw,
  Square,
  Upload,
  Video,
} from "lucide-react";
import {
  COMMUNITY_PRAYER_AUDIO_MAX_DURATION_SECONDS,
  inferPrayerMediaHasVideo,
  prayerMediaFileFromBlob,
  validateCommunityPrayerMediaFile,
} from "@/lib/community/media-upload";
import {
  PRAYER_RECORDER_COPY,
  PRAYER_RECORDER_VERSION,
} from "@/lib/community/prayer-recorder-copy";
import {
  extensionFromRecorderBlob,
  pickRecorderMimeTypeForMode,
  supportsBrowserVideoPrayerRecording,
  supportsBrowserVoiceRecording as browserSupportsVoiceRecording,
  type PrayerRecordingMode,
} from "@/lib/community/voice-recording";
import { cn } from "@/lib/utils";

const UPLOAD_ENDPOINT = "/api/community/upload-prayer-audio";

export type VoicePrayerUploadResult = {
  audioUrl: string;
  durationSeconds: number;
  mimeType: string;
  filename: string;
  hasVideo: boolean;
  originalFileName?: string;
};

type UploadApiResponse = {
  url?: string;
  mimeType?: string;
  filename?: string;
  hasVideo?: boolean;
  originalFileName?: string;
  error?: string;
  detail?: string;
};

function formatTimer(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function supportsBrowserVoiceRecording(): boolean {
  return browserSupportsVoiceRecording();
}

export function supportsBrowserPrayerVideoRecording(): boolean {
  return supportsBrowserVideoPrayerRecording();
}

function uploadErrorMessage(data: UploadApiResponse, status: number): string {
  const base = data.error ?? `Upload failed (${status})`;
  if (process.env.NODE_ENV === "development" && data.detail) {
    return `${base} — ${data.detail}`;
  }
  return base;
}

/** Resolve duration from a local object URL (iOS often delays loadedmetadata). */
function measureMediaDurationSeconds(
  objectUrl: string,
  maxSeconds: number,
  kind: PrayerRecordingMode,
): Promise<number> {
  return new Promise((resolve) => {
    const el =
      kind === "video" ? document.createElement("video") : new Audio();
    let settled = false;
    const finish = (seconds: number) => {
      if (settled) return;
      settled = true;
      if (el instanceof HTMLVideoElement) {
        el.src = "";
        el.load();
      } else {
        el.src = "";
      }
      resolve(Math.min(maxSeconds, Math.max(0, Math.round(seconds))));
    };
    el.addEventListener(
      "loadedmetadata",
      () => {
        finish(Number.isFinite(el.duration) ? el.duration : 0);
      },
      { once: true },
    );
    el.addEventListener("error", () => finish(0), { once: true });
    el.src = objectUrl;
    if (el instanceof HTMLVideoElement) {
      el.playsInline = true;
    }
    window.setTimeout(() => finish(0), 4000);
  });
}

export function CommunityVoicePrayerRecorder({
  postId,
  spaceSlug,
  disabled,
  onReady,
  onClear,
  autoStartRecording = false,
  minimal = false,
}: {
  postId?: string;
  spaceSlug?: string;
  disabled?: boolean;
  onReady: (result: VoicePrayerUploadResult) => void;
  onClear: () => void;
  autoStartRecording?: boolean;
  minimal?: boolean;
}) {
  const canRecord = supportsBrowserVoiceRecording();
  const canRecordVideo = supportsBrowserPrayerVideoRecording();
  const maxSeconds = COMMUNITY_PRAYER_AUDIO_MAX_DURATION_SECONDS;

  const [captureMode, setCaptureMode] = useState<PrayerRecordingMode>("audio");
  const [phase, setPhase] = useState<
    "idle" | "recording" | "preview" | "uploading" | "ready"
  >("idle");
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localBlob, setLocalBlob] = useState<Blob | null>(null);
  const [localFilename, setLocalFilename] = useState<string>("voice-prayer.webm");
  const [localHasVideo, setLocalHasVideo] = useState(false);
  const [originalFileName, setOriginalFileName] = useState<string | undefined>();
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const captureModeRef = useRef<PrayerRecordingMode>("audio");

  const remaining = Math.max(0, maxSeconds - elapsed);

  useEffect(() => {
    captureModeRef.current = captureMode;
  }, [captureMode]);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null;
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
  }, []);

  const resetLocal = useCallback(
    (notifyParent: boolean) => {
      clearTimer();
      stopTracks();
      revokePreview();
      setLocalBlob(null);
      setLocalFilename("voice-prayer.webm");
      setLocalHasVideo(false);
      setOriginalFileName(undefined);
      setDurationSeconds(0);
      setElapsed(0);
      setUploadError(null);
      setMicError(null);
      setPhase("idle");
      mediaRecorderRef.current = null;
      chunksRef.current = [];
      if (notifyParent) onClear();
    },
    [clearTimer, stopTracks, revokePreview, onClear],
  );

  useEffect(
    () => () => {
      clearTimer();
      stopTracks();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [clearTimer, stopTracks],
  );

  const uploadBlob = useCallback(
    async (
      blob: Blob,
      filename: string,
      duration: number,
      hasVideo: boolean,
      uploadedOriginalName?: string,
    ) => {
      setUploadError(null);
      setPhase("uploading");
      const file = prayerMediaFileFromBlob(blob, filename);
      const validationErr = validateCommunityPrayerMediaFile(file);
      if (validationErr) {
        setUploadError(validationErr);
        setPhase("preview");
        return;
      }
      try {
        const fd = new FormData();
        fd.append("file", file);
        if (postId) fd.append("postId", postId);
        else if (spaceSlug) fd.append("spaceSlug", spaceSlug);

        const res = await fetch(UPLOAD_ENDPOINT, { method: "POST", body: fd });
        const data = (await res.json()) as UploadApiResponse;
        if (!res.ok || !data.url) {
          setUploadError(uploadErrorMessage(data, res.status));
          setPhase("preview");
          return;
        }
        const resolvedHasVideo = data.hasVideo ?? hasVideo;
        onReady({
          audioUrl: data.url,
          durationSeconds: duration,
          mimeType: data.mimeType ?? file.type,
          filename: data.filename ?? filename,
          hasVideo: resolvedHasVideo,
          originalFileName: data.originalFileName ?? uploadedOriginalName,
        });
        setPhase("ready");
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Could not upload. Check your connection and try again.";
        setUploadError(msg);
        setPhase("preview");
      }
    },
    [postId, spaceSlug, onReady],
  );

  const retryUpload = useCallback(() => {
    if (!localBlob) return;
    void uploadBlob(
      localBlob,
      localFilename,
      durationSeconds,
      localHasVideo,
      originalFileName,
    );
  }, [
    localBlob,
    localFilename,
    durationSeconds,
    localHasVideo,
    originalFileName,
    uploadBlob,
  ]);

  const autoStartedRef = useRef(false);

  useEffect(() => {
    if (!autoStartRecording || !canRecord || disabled || autoStartedRef.current) return;
    if (phase !== "idle") return;
    autoStartedRef.current = true;
    const id = window.setTimeout(() => {
      void startRecording(captureModeRef.current);
    }, 280);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot auto-start
  }, [autoStartRecording, canRecord, disabled, phase]);

  async function handleUploadedFile(file: File) {
    setUploadError(null);
    setMicError(null);
    const err = validateCommunityPrayerMediaFile(file);
    if (err) {
      setUploadError(err);
      return;
    }
    const hasVideo = inferPrayerMediaHasVideo(file);
    revokePreview();
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setPreviewUrl(url);
    setLocalBlob(file);
    setLocalFilename(file.name);
    setLocalHasVideo(hasVideo);
    setOriginalFileName(file.name);
    setCaptureMode(hasVideo ? "video" : "audio");
    setPhase("preview");
    const dur = await measureMediaDurationSeconds(
      url,
      maxSeconds,
      hasVideo ? "video" : "audio",
    );
    const duration = dur > 0 ? dur : 1;
    setDurationSeconds(duration);
    setElapsed(duration);
    void uploadBlob(file, file.name, duration, hasVideo, file.name);
  }

  async function startRecording(mode: PrayerRecordingMode) {
    setMicError(null);
    setUploadError(null);
    resetLocal(true);
    setCaptureMode(mode);

    const constraints: MediaStreamConstraints =
      mode === "video"
        ? { audio: true, video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } }
        : { audio: true };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (mode === "video" && liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        liveVideoRef.current.muted = true;
        await liveVideoRef.current.play().catch(() => undefined);
      }

      const preferredMime = pickRecorderMimeTypeForMode(mode);
      let recorder: MediaRecorder;
      try {
        recorder = preferredMime
          ? new MediaRecorder(stream, { mimeType: preferredMime })
          : new MediaRecorder(stream);
      } catch {
        recorder = new MediaRecorder(stream);
      }

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        clearTimer();
        stopTracks();
        const blobType =
          recorder.mimeType || preferredMime || chunksRef.current[0]?.type || (mode === "video" ? "video/webm" : "audio/webm");
        const blob = new Blob(chunksRef.current, { type: blobType });
        if (blob.size < 1) {
          setMicError(
            mode === "video"
              ? "Recording was empty. Try again or upload a file."
              : "Recording was empty. Try again or upload an audio file.",
          );
          setPhase("idle");
          return;
        }
        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;
        setPreviewUrl(url);
        setLocalBlob(blob);
        const hasVideo = mode === "video" || blobType.startsWith("video/");
        setLocalHasVideo(hasVideo);
        const duration = Math.min(
          maxSeconds,
          Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)),
        );
        setDurationSeconds(duration);
        setElapsed(duration);
        setPhase("preview");
        const ext = extensionFromRecorderBlob(blob, preferredMime, mode);
        const filename = `${hasVideo ? "video" : "voice"}-prayer.${ext}`;
        setLocalFilename(filename);
        void uploadBlob(blob, filename, duration, hasVideo);
      };
      recorder.onerror = () => {
        setMicError("Recording failed. Try again or upload a file.");
        clearTimer();
        stopTracks();
        setPhase("idle");
      };
      mediaRecorderRef.current = recorder;
      startedAtRef.current = Date.now();
      recorder.start(500);
      setPhase("recording");
      setElapsed(0);
      timerRef.current = setInterval(() => {
        const sec = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setElapsed(sec);
        if (sec >= maxSeconds) {
          stopRecording();
        }
      }, 200);
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      const isVideo = mode === "video";
      setMicError(
        name === "NotAllowedError" || name === "PermissionDeniedError"
          ? isVideo
            ? "Camera or microphone access was denied. Allow access in Settings, or upload a file instead."
            : "Microphone access was denied. Allow the mic in Settings, or upload a file instead."
          : isVideo
            ? "Camera is unavailable. You can upload a file instead."
            : "Microphone is unavailable. You can upload a file instead.",
      );
      setPhase("idle");
    }
  }

  function stopRecording() {
    clearTimer();
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") {
      try {
        rec.stop();
      } catch {
        setMicError("Could not stop recording. Try uploading a file instead.");
        stopTracks();
        setPhase("idle");
      }
    }
  }

  function switchCaptureMode(mode: PrayerRecordingMode) {
    if (phase === "recording" || phase === "uploading") return;
    setCaptureMode(mode);
    resetLocal(true);
  }

  const busy = disabled || phase === "uploading";
  const hasLocalMedia = Boolean(localBlob && previewUrl);
  const showPreview =
    hasLocalMedia && (phase === "preview" || phase === "uploading" || phase === "ready");

  const fileInput = (
    <input
      ref={fileRef}
      type="file"
      accept="audio/*,video/*,.mp3,.m4a,.webm,.wav,.aac,.mp4"
      className="sr-only"
      disabled={busy}
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) void handleUploadedFile(f);
        e.target.value = "";
      }}
    />
  );

  return (
    <div
      className="space-y-3"
      data-prayer-recorder-version={PRAYER_RECORDER_VERSION}
    >
      {canRecord ? (
        <div className="space-y-3">
          {canRecordVideo ? (
            <div
              className="flex rounded-full bg-brand-surface/50 p-0.5 ring-1 ring-black/[0.04]"
              role="tablist"
              aria-label="Recording type"
            >
              <button
                type="button"
                role="tab"
                aria-selected={captureMode === "audio"}
                disabled={busy || phase === "recording"}
                onClick={() => switchCaptureMode("audio")}
                className={cn(
                  "flex-1 inline-flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-medium min-h-[2.5rem] transition-colors",
                  captureMode === "audio"
                    ? "bg-white text-brand-ink shadow-sm"
                    : "text-brand-ink/55 hover:text-brand-ink",
                )}
              >
                <Mic className="h-3.5 w-3.5" aria-hidden />
                Audio only
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={captureMode === "video"}
                disabled={busy || phase === "recording"}
                onClick={() => switchCaptureMode("video")}
                className={cn(
                  "flex-1 inline-flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-medium min-h-[2.5rem] transition-colors",
                  captureMode === "video"
                    ? "bg-white text-brand-ink shadow-sm"
                    : "text-brand-ink/55 hover:text-brand-ink",
                )}
              >
                <Video className="h-3.5 w-3.5" aria-hidden />
                Video
              </button>
            </div>
          ) : null}

          {phase === "recording" ? (
            <div className="rounded-2xl bg-red-50/90 ring-1 ring-red-200/60 px-4 py-4 text-center space-y-3">
              {captureMode === "video" ? (
                <video
                  ref={liveVideoRef}
                  className="mx-auto w-full max-h-48 rounded-xl bg-black object-cover"
                  playsInline
                  muted
                  aria-label="Camera preview"
                />
              ) : null}
              <p className="text-sm font-medium text-red-900/90">
                {captureMode === "video" ? "Recording video…" : "Recording…"}
              </p>
              <p className="text-2xl font-semibold tabular-nums text-red-900">
                {formatTimer(elapsed)}
              </p>
              <p className="text-xs text-red-900/60">
                {remaining > 0
                  ? `${formatTimer(remaining)} remaining (max ${formatTimer(maxSeconds)})`
                  : "Max length reached"}
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={stopRecording}
                className={cn(
                  "mx-auto inline-flex items-center justify-center gap-2 rounded-full",
                  "bg-red-600 text-white min-h-[3rem] min-w-[10rem] px-6 text-sm font-semibold",
                  "hover:bg-red-700 active:scale-[0.98] transition-all",
                )}
              >
                <Square className="h-5 w-5 fill-current" aria-hidden />
                Stop recording
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void startRecording(captureMode)}
              className={cn(
                "w-full inline-flex flex-col items-center justify-center gap-2 rounded-2xl",
                "bg-brand-primary text-white min-h-[4.5rem] px-6 py-4",
                "hover:bg-brand-primary/90 active:scale-[0.99] transition-all",
                "shadow-[0_4px_20px_rgba(30,54,68,0.18)]",
              )}
            >
              {captureMode === "video" ? (
                <Video className="h-7 w-7" aria-hidden />
              ) : (
                <Mic className="h-7 w-7" aria-hidden />
              )}
              <span className="text-sm font-semibold">
                {captureMode === "video"
                  ? PRAYER_RECORDER_COPY.startRecordingVideo
                  : PRAYER_RECORDER_COPY.startRecordingAudio}
              </span>
              <span className="text-[11px] text-white/75 font-normal">
                Up to {formatTimer(maxSeconds)}
              </span>
            </button>
          )}

          {showPreview ? (
            <div className="rounded-xl bg-white ring-1 ring-brand-primary/15 px-3 py-3 space-y-2">
              <p className="text-xs font-medium text-brand-ink/60">Preview</p>
              {localHasVideo ? (
                <video
                  controls
                  src={previewUrl ?? undefined}
                  className="w-full max-h-56 rounded-lg bg-black/[0.04]"
                  preload="metadata"
                  playsInline
                />
              ) : (
                <audio
                  controls
                  src={previewUrl ?? undefined}
                  className="w-full h-11 rounded-lg"
                  preload="metadata"
                  playsInline
                />
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => resetLocal(true)}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-brand-ink/70 ring-1 ring-black/[0.08] hover:bg-black/[0.03]"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  Re-record
                </button>
                {uploadError && localBlob ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={retryUpload}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-brand-primary ring-1 ring-brand-primary/25 hover:bg-brand-primary/5"
                  >
                    Retry upload
                  </button>
                ) : null}
              </div>
              {phase === "uploading" ? (
                <p className="text-xs text-brand-ink/50 inline-flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  Uploading…
                </p>
              ) : null}
              {phase === "ready" ? (
                <p className="text-xs text-brand-primary font-medium">
                  Upload complete — you can share your prayer.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-brand-ink/55 rounded-xl bg-brand-surface/40 px-3 py-2.5 ring-1 ring-black/[0.04]">
          {PRAYER_RECORDER_COPY.browserNoRecord}
        </p>
      )}

      {!minimal ? (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-black/[0.06]" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wide">
              <span className="bg-white/90 px-2 text-brand-ink/40">or upload</span>
            </div>
          </div>
          {fileInput}
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "w-full rounded-xl border border-dashed border-brand-primary/25",
              "bg-brand-primary/[0.04] px-4 py-3.5 text-sm text-brand-ink/70 min-h-[3rem]",
              "hover:bg-brand-primary/[0.07] transition-colors inline-flex items-center justify-center gap-2",
            )}
          >
            <Upload className="h-4 w-4 shrink-0" aria-hidden />
            {PRAYER_RECORDER_COPY.uploadHelper}
          </button>
        </>
      ) : (
        <>
          {fileInput}
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="text-[12px] text-brand-primary/80 font-medium hover:underline min-h-[2.75rem]"
          >
            {PRAYER_RECORDER_COPY.uploadFileInstead}
          </button>
          <p className="text-[11px] text-center text-brand-ink/50 leading-relaxed px-1">
            {PRAYER_RECORDER_COPY.uploadHelper}
          </p>
        </>
      )}

      {micError ? <p className="text-xs text-amber-800">{micError}</p> : null}
      {uploadError ? <p className="text-xs text-red-600">{uploadError}</p> : null}
    </div>
  );
}
