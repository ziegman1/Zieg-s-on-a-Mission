"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2,
  Mic,
  RotateCcw,
  Square,
  Upload,
} from "lucide-react";
import {
  COMMUNITY_PRAYER_AUDIO_MAX_DURATION_SECONDS,
  prayerAudioFileFromBlob,
  validateCommunityPrayerAudioFile,
} from "@/lib/community/media-upload";
import {
  extensionFromRecorderBlob,
  pickRecorderMimeType,
  supportsBrowserVoiceRecording as browserSupportsVoiceRecording,
} from "@/lib/community/voice-recording";
import { cn } from "@/lib/utils";

const UPLOAD_ENDPOINT = "/api/community/upload-prayer-audio";

export type VoicePrayerUploadResult = {
  audioUrl: string;
  durationSeconds: number;
  mimeType: string;
  filename: string;
};

type UploadApiResponse = {
  url?: string;
  mimeType?: string;
  filename?: string;
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

function uploadErrorMessage(data: UploadApiResponse, status: number): string {
  const base = data.error ?? `Upload failed (${status})`;
  if (process.env.NODE_ENV === "development" && data.detail) {
    return `${base} — ${data.detail}`;
  }
  return base;
}

/** Resolve duration from a local object URL (iOS often delays loadedmetadata). */
function measureAudioDurationSeconds(objectUrl: string, maxSeconds: number): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    let settled = false;
    const finish = (seconds: number) => {
      if (settled) return;
      settled = true;
      audio.src = "";
      resolve(Math.min(maxSeconds, Math.max(0, Math.round(seconds))));
    };
    audio.addEventListener(
      "loadedmetadata",
      () => {
        finish(Number.isFinite(audio.duration) ? audio.duration : 0);
      },
      { once: true },
    );
    audio.addEventListener("error", () => finish(0), { once: true });
    audio.src = objectUrl;
    window.setTimeout(() => finish(0), 3000);
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
  /** When creating a new room post (no postId yet), validates voice is enabled for the space. */
  spaceSlug?: string;
  disabled?: boolean;
  onReady: (result: VoicePrayerUploadResult) => void;
  onClear: () => void;
  /** Open the mic prompt as soon as the composer mounts (room voice flow). */
  autoStartRecording?: boolean;
  /** Hide upload divider when room composer is voice-only. */
  minimal?: boolean;
}) {
  const canRecord = supportsBrowserVoiceRecording();
  const maxSeconds = COMMUNITY_PRAYER_AUDIO_MAX_DURATION_SECONDS;

  const [phase, setPhase] = useState<
    "idle" | "recording" | "preview" | "uploading" | "ready"
  >("idle");
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localBlob, setLocalBlob] = useState<Blob | null>(null);
  const [localFilename, setLocalFilename] = useState<string>("voice-prayer.webm");
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

  const remaining = Math.max(0, maxSeconds - elapsed);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
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
    async (blob: Blob, filename: string, duration: number) => {
      setUploadError(null);
      setPhase("uploading");
      const file = prayerAudioFileFromBlob(blob, filename);
      const validationErr = validateCommunityPrayerAudioFile(file);
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
        onReady({
          audioUrl: data.url,
          durationSeconds: duration,
          mimeType: data.mimeType ?? file.type,
          filename: data.filename ?? filename,
        });
        setPhase("ready");
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Could not upload audio. Check your connection and try again.";
        setUploadError(msg);
        setPhase("preview");
      }
    },
    [postId, spaceSlug, onReady],
  );

  const retryUpload = useCallback(() => {
    if (!localBlob) return;
    void uploadBlob(localBlob, localFilename, durationSeconds);
  }, [localBlob, localFilename, durationSeconds, uploadBlob]);

  const autoStartedRef = useRef(false);

  useEffect(() => {
    if (!autoStartRecording || !canRecord || disabled || autoStartedRef.current) return;
    if (phase !== "idle") return;
    autoStartedRef.current = true;
    const id = window.setTimeout(() => {
      void startRecording();
    }, 280);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- startRecording is stable enough for one-shot auto-start
  }, [autoStartRecording, canRecord, disabled, phase]);

  async function handleUploadedFile(file: File) {
    setUploadError(null);
    setMicError(null);
    const err = validateCommunityPrayerAudioFile(file);
    if (err) {
      setUploadError(err);
      return;
    }
    revokePreview();
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setPreviewUrl(url);
    setLocalBlob(file);
    setLocalFilename(file.name);
    setPhase("preview");
    const dur = await measureAudioDurationSeconds(url, maxSeconds);
    const duration = dur > 0 ? dur : 1;
    setDurationSeconds(duration);
    setElapsed(duration);
    void uploadBlob(file, file.name, duration);
  }

  async function startRecording() {
    setMicError(null);
    setUploadError(null);
    resetLocal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const preferredMime = pickRecorderMimeType();
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
          recorder.mimeType || preferredMime || chunksRef.current[0]?.type || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: blobType });
        if (blob.size < 1) {
          setMicError("Recording was empty. Try again or upload an audio file.");
          setPhase("idle");
          return;
        }
        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;
        setPreviewUrl(url);
        setLocalBlob(blob);
        const duration = Math.min(
          maxSeconds,
          Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)),
        );
        setDurationSeconds(duration);
        setElapsed(duration);
        setPhase("preview");
        const ext = extensionFromRecorderBlob(blob, preferredMime);
        const filename = `voice-prayer.${ext}`;
        setLocalFilename(filename);
        void uploadBlob(blob, filename, duration);
      };
      recorder.onerror = () => {
        setMicError("Recording failed. Try again or upload an audio file.");
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
      setMicError(
        name === "NotAllowedError" || name === "PermissionDeniedError"
          ? "Microphone access was denied. Allow the mic in Settings, or upload an audio file instead."
          : "Microphone is unavailable. You can upload an audio file instead.",
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

  const busy = disabled || phase === "uploading";
  const hasLocalAudio = Boolean(localBlob && previewUrl);
  const showPreview = hasLocalAudio && (phase === "preview" || phase === "uploading" || phase === "ready");

  const fileInput = (
    <input
      ref={fileRef}
      type="file"
      accept="audio/*,.mp3,.m4a,.webm,.wav,.aac,.ogg"
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
    <div className="space-y-3">
      {canRecord ? (
        <div className="space-y-3">
          {phase === "recording" ? (
            <div className="rounded-2xl bg-red-50/90 ring-1 ring-red-200/60 px-4 py-4 text-center space-y-3">
              <p className="text-sm font-medium text-red-900/90">Recording…</p>
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
              onClick={() => void startRecording()}
              className={cn(
                "w-full inline-flex flex-col items-center justify-center gap-2 rounded-2xl",
                "bg-brand-primary text-white min-h-[4.5rem] px-6 py-4",
                "hover:bg-brand-primary/90 active:scale-[0.99] transition-all",
                "shadow-[0_4px_20px_rgba(30,54,68,0.18)]",
              )}
            >
              <Mic className="h-7 w-7" aria-hidden />
              <span className="text-sm font-semibold">Start recording</span>
              <span className="text-[11px] text-white/75 font-normal">
                Up to {formatTimer(maxSeconds)}
              </span>
            </button>
          )}

          {showPreview ? (
            <div className="rounded-xl bg-white ring-1 ring-brand-primary/15 px-3 py-3 space-y-2">
              <p className="text-xs font-medium text-brand-ink/60">Preview</p>
              <audio
                controls
                src={previewUrl ?? undefined}
                className="w-full h-11 rounded-lg"
                preload="metadata"
                playsInline
              />
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
                  Uploading voice prayer…
                </p>
              ) : null}
              {phase === "ready" ? (
                <p className="text-xs text-brand-primary font-medium">
                  Upload complete — you can share your voice prayer.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-brand-ink/55 rounded-xl bg-brand-surface/40 px-3 py-2.5 ring-1 ring-black/[0.04]">
          Recording is not supported in this browser. You can upload an audio file instead.
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
            Upload audio (MP3, M4A, WebM, WAV, AAC)
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
            Upload an audio file instead
          </button>
        </>
      )}

      {micError ? <p className="text-xs text-amber-800">{micError}</p> : null}
      {uploadError ? <p className="text-xs text-red-600">{uploadError}</p> : null}
    </div>
  );
}
