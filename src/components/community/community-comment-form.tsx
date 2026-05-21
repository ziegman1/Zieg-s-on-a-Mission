"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import type { CommentAuthorContext } from "@/lib/community/members";
import { CommunityAvatar } from "./community-avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  authorContext,
  onSubmit,
  disabled,
  submitLabel = "Post",
  commentPlaceholder,
}: {
  authorContext: CommentAuthorContext;
  onSubmit: (body: string) => Promise<void>;
  disabled?: boolean;
  submitLabel?: string;
  commentPlaceholder?: string | null;
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const name = authorLabel(authorContext);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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
    <form onSubmit={handleSubmit} className="rounded-xl bg-white/90 ring-1 ring-black/[0.04] p-3 space-y-3">
      <div className="flex items-center gap-2.5">
        <CommunityAvatar name={name} imageUrl={authorImage(authorContext)} size="sm" />
        <p className="text-xs text-brand-ink/60">
          Commenting as <span className="font-semibold text-brand-ink">{name}</span>
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="mh-comment-body" className="sr-only">
          Comment
        </Label>
        <Textarea
          id="mh-comment-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            commentPlaceholder?.trim() ||
            "Share encouragement, prayer, or a note…"
          }
          rows={3}
          maxLength={2000}
          disabled={disabled || isPending}
          className="text-[15px] leading-relaxed bg-white border-black/[0.08] resize-y min-h-[4.5rem] rounded-xl"
        />
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <Button
        type="submit"
        size="sm"
        disabled={disabled || isPending}
        className="rounded-full min-h-[2.5rem] px-5"
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
