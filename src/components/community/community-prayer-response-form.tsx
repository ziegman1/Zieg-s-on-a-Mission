"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { Loader2, Mic, PenLine } from "lucide-react";
import type { CommentAuthorContext } from "@/lib/community/members";
import { encodeVoicePrayerBody } from "@/lib/community/prayer-response-body";
import { PRAYER_RECORDER_COPY } from "@/lib/community/prayer-recorder-copy";
import type { SpaceInteractionPreset } from "@/lib/community/space-interaction";
import type { VoicePrayerUploadResult } from "./community-voice-prayer-recorder";
import { CommunityVoicePrayerRecorder } from "./community-voice-prayer-recorder";
import { CommunityAvatar } from "./community-avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function authorLabel(ctx: CommentAuthorContext): string {
  if (ctx.kind === "owner") return ctx.displayName;
  if (ctx.kind === "member" || ctx.kind === "visitor") {
    return `${ctx.member.firstName} ${ctx.member.lastName}`.trim();
  }
  return "";
}

function authorImage(ctx: CommentAuthorContext): string | null {
  if (ctx.kind === "owner") return ctx.profileImageUrl;
  if (ctx.kind === "member" || ctx.kind === "visitor") return ctx.member.profileImageUrl;
  return null;
}

export function CommunityPrayerResponseForm({
  postId,
  authorContext,
  preset,
  onSubmit,
  disabled,
  allowVoice = false,
  autoFocus = false,
  variant = "inline",
}: {
  postId: string;
  authorContext: CommentAuthorContext;
  preset: SpaceInteractionPreset;
  onSubmit: (body: string) => Promise<void>;
  disabled?: boolean;
  /** From `canUseVoicePrayer()` — prayer room with voice prayers enabled */
  allowVoice?: boolean;
  /** Focus textarea when mounted (composer sheet) */
  autoFocus?: boolean;
  variant?: "inline" | "sheet";
}) {
  const [mode, setMode] = useState<"written" | "voice">("written");
  const [body, setBody] = useState("");
  const [voiceReady, setVoiceReady] = useState<VoicePrayerUploadResult | null>(null);
  const [recorderKey, setRecorderKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const textareaId = useId();
  const isSheet = variant === "sheet";

  useEffect(() => {
    if (!autoFocus || mode !== "written") return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(textareaId) as HTMLTextAreaElement | null;
      if (!el) return;
      el.focus({ preventScroll: true });
      const len = el.value.length;
      el.setSelectionRange(len, len);
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [autoFocus, mode, textareaId]);

  const name = authorLabel(authorContext);
  const { comments: copy } = preset;
  const showVoice = Boolean(allowVoice);

  function resetVoice() {
    setVoiceReady(null);
    setRecorderKey((k) => k + 1);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (mode === "voice" && showVoice) {
          if (!voiceReady) {
            setError(PRAYER_RECORDER_COPY.recordOrUploadFirst);
            return;
          }
          await onSubmit(
            encodeVoicePrayerBody({
              audioUrl: voiceReady.audioUrl,
              durationSeconds: voiceReady.durationSeconds,
              mimeType: voiceReady.mimeType,
              filename: voiceReady.filename,
              hasVideo: voiceReady.hasVideo,
              originalFileName: voiceReady.originalFileName,
            }),
          );
          resetVoice();
        } else {
          if (!body.trim()) {
            setError("Please share your prayer in writing.");
            return;
          }
          await onSubmit(body.trim());
          setBody("");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not share prayer");
      }
    });
  }

  const voiceSubmitDisabled =
    disabled || isPending || (mode === "voice" && showVoice && !voiceReady);

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "space-y-3",
        !isSheet &&
          "rounded-2xl bg-white/92 ring-1 ring-brand-primary/10 p-3.5 sm:p-4 shadow-[0_1px_16px_rgba(30,54,68,0.04)]",
      )}
    >
      <div className="flex items-center gap-2.5">
        <CommunityAvatar name={name} imageUrl={authorImage(authorContext)} size="sm" />
        <p className="text-xs text-brand-ink/60">
          Praying as <span className="font-medium text-brand-ink">{name}</span>
        </p>
      </div>

      {showVoice ? (
        <div
          className="flex rounded-full bg-brand-surface/50 p-0.5 ring-1 ring-black/[0.04]"
          role="tablist"
          aria-label="Prayer response type"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "written"}
            onClick={() => {
              setMode("written");
              setError(null);
            }}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-medium transition-colors min-h-[2.75rem]",
              mode === "written"
                ? "bg-white text-brand-ink shadow-sm"
                : "text-brand-ink/55 hover:text-brand-ink",
            )}
          >
            <PenLine className="h-3.5 w-3.5" aria-hidden />
            {copy.composerWrittenLabel}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "voice"}
            onClick={() => {
              setMode("voice");
              setError(null);
            }}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-medium transition-colors min-h-[2.75rem]",
              mode === "voice"
                ? "bg-white text-brand-ink shadow-sm"
                : "text-brand-ink/55 hover:text-brand-ink",
            )}
          >
            <Mic className="h-3.5 w-3.5" aria-hidden />
            {copy.composerVoiceLabel}
          </button>
        </div>
      ) : null}

      {mode === "written" || !showVoice ? (
        <div className="space-y-1.5">
          <Label htmlFor={textareaId} className="sr-only">
            Written prayer
          </Label>
          <Textarea
            id={textareaId}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={copy.placeholder}
            rows={isSheet ? 4 : 3}
            maxLength={2000}
            disabled={disabled || isPending}
            autoFocus={autoFocus && mode === "written"}
            enterKeyHint="send"
            className={cn(
              "text-[15px] leading-relaxed bg-white border-black/[0.08] resize-none rounded-xl",
              isSheet ? "min-h-[7rem] text-base" : "resize-y min-h-[4.5rem]",
            )}
          />
        </div>
      ) : (
        <CommunityVoicePrayerRecorder
          key={recorderKey}
          postId={postId}
          disabled={disabled || isPending}
          onReady={(result) => {
            setVoiceReady(result);
            setError(null);
          }}
          onClear={() => setVoiceReady(null)}
        />
      )}

      {voiceReady && mode === "voice" && showVoice ? (
        <p className="text-xs text-brand-primary/80 font-medium">
          {PRAYER_RECORDER_COPY.readyHint}
        </p>
      ) : null}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <Button
        type="submit"
        size="sm"
        disabled={voiceSubmitDisabled}
        className={cn(
          "rounded-full min-h-[2.875rem] px-6 text-sm font-semibold bg-brand-primary hover:bg-brand-primary w-full",
          isSheet && "min-h-[3rem] text-[15px]",
        )}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" aria-hidden />
            Sharing…
          </>
        ) : (
          copy.submitVoice
        )}
      </Button>
    </form>
  );
}
