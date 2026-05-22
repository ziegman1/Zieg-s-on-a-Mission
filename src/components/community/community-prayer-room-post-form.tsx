"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { createPrayerRoomPostAction } from "@/app/(storefront)/community/post-actions";
import type { CommentAuthorContext } from "@/lib/community/members";
import { encodeVoicePrayerBody } from "@/lib/community/prayer-response-body";
import type { PrayerRoomComposerPreset } from "@/lib/community/prayer-room-composer";
import {
  CommunityVoicePrayerRecorder,
  supportsBrowserVoiceRecording,
  type VoicePrayerUploadResult,
} from "./community-voice-prayer-recorder";
import { CommunityAvatar } from "./community-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export function CommunityPrayerRoomPostForm({
  spaceId,
  spaceSlug,
  preset,
  authorContext,
  allowVoice,
  autoFocus = true,
  onSuccess,
}: {
  spaceId: string;
  spaceSlug: string;
  preset: PrayerRoomComposerPreset;
  authorContext: CommentAuthorContext;
  allowVoice: boolean;
  autoFocus?: boolean;
  onSuccess: (message: string) => void;
}) {
  const [mode, setMode] = useState<"written" | "voice">(preset.initialMode);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [voiceReady, setVoiceReady] = useState<VoicePrayerUploadResult | null>(null);
  const [recorderKey, setRecorderKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const titleId = useId();
  const bodyId = useId();

  const voiceOnly = preset.kind === "voice_prayer";
  const showVoice = allowVoice && voiceOnly;
  const canRecord = supportsBrowserVoiceRecording();

  useEffect(() => {
    setMode(preset.initialMode);
    setTitle("");
    setBody("");
    setVoiceReady(null);
    setRecorderKey((k) => k + 1);
    setError(null);
  }, [preset.kind, preset.initialMode]);

  useEffect(() => {
    if (!autoFocus || mode !== "written" || voiceOnly) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(bodyId) as HTMLTextAreaElement | null;
      if (!el) return;
      el.focus({ preventScroll: true });
      const len = el.value.length;
      el.setSelectionRange(len, len);
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [autoFocus, mode, bodyId, preset.kind, voiceOnly]);

  function resetVoice() {
    setVoiceReady(null);
    setRecorderKey((k) => k + 1);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      let payloadBody: string;
      if (mode === "voice" && showVoice) {
        if (!voiceReady) {
          setError(
            canRecord
              ? "Record or upload a voice prayer first."
              : "Upload an audio file to share your voice prayer.",
          );
          return;
        }
        payloadBody = encodeVoicePrayerBody({
          audioUrl: voiceReady.audioUrl,
          durationSeconds: voiceReady.durationSeconds,
          mimeType: voiceReady.mimeType,
          filename: voiceReady.filename,
        });
      } else {
        const text = body.trim();
        if (!text) {
          setError("Please write something to share.");
          return;
        }
        payloadBody = text;
      }

      const res = await createPrayerRoomPostAction({
        spaceId,
        title: title.trim() || undefined,
        body: payloadBody,
        postType:
          preset.postType === "praise" || preset.postType === "encouragement"
            ? preset.postType
            : "prayer",
        composerKind: preset.kind,
      });

      if (!res.ok) {
        setError(res.error);
        return;
      }

      onSuccess(preset.successMessage);
    });
  }

  const name = authorLabel(authorContext);
  const voiceSubmitDisabled =
    isPending || (mode === "voice" && showVoice && !voiceReady);
  const writtenSubmitDisabled = isPending || (mode === "written" && !body.trim());

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-3", voiceOnly && "space-y-4")}>
      {!voiceOnly ? (
        <div className="flex items-center gap-2.5">
          <CommunityAvatar name={name} imageUrl={authorImage(authorContext)} size="sm" />
          <p className="text-xs text-brand-ink/60">
            Sharing as <span className="font-medium text-brand-ink">{name}</span>
          </p>
        </div>
      ) : (
        <p className="text-xs text-center text-brand-ink/55">
          Sharing as <span className="font-medium text-brand-ink">{name}</span>
        </p>
      )}

      {!voiceOnly ? (
        <div className="space-y-1.5">
          <Label htmlFor={titleId} className="text-xs text-brand-ink/65">
            Title (optional)
          </Label>
          <Input
            id={titleId}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={preset.titlePlaceholder}
            disabled={isPending}
            className="h-9 rounded-xl border-black/[0.08] bg-white text-[14px]"
          />
        </div>
      ) : null}

      {mode === "written" && !voiceOnly ? (
        <div className="space-y-1.5">
          <Label htmlFor={bodyId} className="sr-only">
            Post body
          </Label>
          <Textarea
            id={bodyId}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={preset.bodyPlaceholder}
            rows={4}
            maxLength={50000}
            disabled={isPending}
            enterKeyHint="send"
            className="min-h-[6.5rem] text-[15px] leading-relaxed bg-white border-black/[0.08] resize-none rounded-xl"
          />
        </div>
      ) : showVoice ? (
        <div className="space-y-3">
          <CommunityVoicePrayerRecorder
            key={recorderKey}
            spaceSlug={spaceSlug}
            disabled={isPending}
            autoStartRecording={voiceOnly && canRecord}
            minimal={voiceOnly}
            onReady={(result) => {
              setVoiceReady(result);
              setError(null);
            }}
            onClear={() => setVoiceReady(null)}
          />
          {!canRecord ? (
            <p className="text-xs text-center text-brand-ink/55 leading-relaxed">
              Recording is not available in this browser — upload a file instead.
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-600 text-center">{error}</p> : null}

      <Button
        type="submit"
        disabled={
          mode === "voice" && showVoice ? voiceSubmitDisabled : writtenSubmitDisabled
        }
        className={cn(
          "w-full rounded-full font-semibold bg-brand-primary hover:bg-brand-primary",
          voiceOnly ? "min-h-[2.75rem] text-[14px]" : "min-h-[2.875rem] text-[15px]",
        )}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" aria-hidden />
            Sharing…
          </>
        ) : (
          preset.submitLabel
        )}
      </Button>
    </form>
  );
}
