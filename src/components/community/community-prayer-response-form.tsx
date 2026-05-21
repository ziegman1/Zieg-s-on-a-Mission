"use client";

import { useState, useTransition } from "react";
import { Loader2, Mic, PenLine } from "lucide-react";
import type { CommentAuthorContext } from "@/lib/community/members";
import { encodeVoicePrayerBody } from "@/lib/community/prayer-response-body";
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
}: {
  postId: string;
  authorContext: CommentAuthorContext;
  preset: SpaceInteractionPreset;
  onSubmit: (body: string) => Promise<void>;
  disabled?: boolean;
  /** From `canUseVoicePrayer()` — prayer room with voice prayers enabled */
  allowVoice?: boolean;
}) {
  const [mode, setMode] = useState<"written" | "voice">("written");
  const [body, setBody] = useState("");
  const [voiceReady, setVoiceReady] = useState<VoicePrayerUploadResult | null>(null);
  const [recorderKey, setRecorderKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
            setError("Record or upload a voice prayer first.");
            return;
          }
          await onSubmit(
            encodeVoicePrayerBody({
              audioUrl: voiceReady.audioUrl,
              durationSeconds: voiceReady.durationSeconds,
              mimeType: voiceReady.mimeType,
              filename: voiceReady.filename,
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
        "rounded-2xl bg-white/92 ring-1 ring-brand-primary/10 p-3.5 sm:p-4 space-y-3",
        "shadow-[0_1px_16px_rgba(30,54,68,0.04)]",
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
            Written Prayer
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
            Voice Prayer
          </button>
        </div>
      ) : null}

      {mode === "written" || !showVoice ? (
        <div className="space-y-1.5">
          <Label htmlFor="mh-prayer-body" className="sr-only">
            Written prayer
          </Label>
          <Textarea
            id="mh-prayer-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={copy.placeholder}
            rows={3}
            maxLength={2000}
            disabled={disabled || isPending}
            className="text-[15px] leading-relaxed bg-white border-black/[0.08] resize-y min-h-[4.5rem] rounded-xl"
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
          Voice prayer ready — tap Share Voice Prayer when you are ready.
        </p>
      ) : null}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <Button
        type="submit"
        size="sm"
        disabled={voiceSubmitDisabled}
        className="rounded-full min-h-[2.75rem] px-6 text-sm bg-brand-primary/90 hover:bg-brand-primary w-full sm:w-auto"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" aria-hidden />
            Sharing…
          </>
        ) : mode === "voice" && showVoice ? (
          copy.submitVoice
        ) : (
          copy.submitWritten
        )}
      </Button>
    </form>
  );
}
