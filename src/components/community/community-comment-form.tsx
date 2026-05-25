"use client";

import { useId, useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import type { CommentAuthorContext } from "@/lib/community/members";
import { useMobileComposerFocus } from "@/lib/community/use-mobile-composer-focus";
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

export function CommunityCommentForm({
  authorContext = null,
  authorLoading = false,
  onSubmit,
  disabled = false,
  submitLabel = "Post",
  commentPlaceholder,
  autoFocus = false,
  autoFocusKey = 0,
  inputId: inputIdProp,
}: {
  authorContext?: CommentAuthorContext | null;
  authorLoading?: boolean;
  onSubmit: (body: string) => Promise<void>;
  disabled?: boolean;
  submitLabel?: string;
  commentPlaceholder?: string | null;
  autoFocus?: boolean;
  /** Increment when the comment panel opens to re-run mobile focus. */
  autoFocusKey?: number;
  inputId?: string;
}) {
  const generatedId = useId();
  const inputId = inputIdProp ?? `mh-comment-${generatedId}`;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canSubmit = Boolean(authorContext) && !disabled && !authorLoading;
  const showAuthor = Boolean(authorContext);

  useMobileComposerFocus(autoFocus, inputRef, autoFocusKey);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!canSubmit) return;
    if (!body.trim()) {
      setError("Please write a comment.");
      return;
    }
    startTransition(async () => {
      try {
        await onSubmit(body.trim());
        setBody("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not post comment");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "rounded-xl bg-white/95 ring-1 ring-black/[0.04] p-3 space-y-3",
        "shadow-[0_-4px_24px_rgba(28,42,68,0.06)]",
      )}
    >
      {showAuthor ? (
        <div className="flex items-center gap-2.5">
          <CommunityAvatar
            name={authorLabel(authorContext!)}
            imageUrl={authorImage(authorContext!)}
            size="sm"
          />
          <p className="text-xs text-brand-ink/60">
            Commenting as{" "}
            <span className="font-semibold text-brand-ink">
              {authorLabel(authorContext!)}
            </span>
          </p>
        </div>
      ) : authorLoading ? (
        <div className="flex items-center gap-2.5" aria-hidden>
          <div className="h-8 w-8 rounded-full bg-brand-surface animate-pulse" />
          <div className="h-3 w-32 rounded bg-brand-surface/80 animate-pulse" />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor={inputId} className="sr-only">
          Comment
        </Label>
        <Textarea
          ref={inputRef}
          id={inputId}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            commentPlaceholder?.trim() ||
            "Share encouragement, prayer, or a note…"
          }
          rows={3}
          maxLength={2000}
          disabled={isPending}
          inputMode="text"
          enterKeyHint="send"
          autoComplete="off"
          autoCorrect="on"
          className={cn(
            "text-[16px] leading-relaxed bg-white border-black/[0.08]",
            "resize-y min-h-[4.5rem] rounded-xl touch-manipulation",
          )}
        />
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <Button
        type="submit"
        size="sm"
        disabled={!canSubmit || isPending}
        className="rounded-full min-h-[2.5rem] px-5 touch-manipulation"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" aria-hidden />
            Posting…
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}
