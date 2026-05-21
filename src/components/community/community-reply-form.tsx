"use client";

import { useState, useTransition } from "react";
import { Loader2, X } from "lucide-react";
import type { SpaceInteractionPreset } from "@/lib/community/space-interaction";
import { getSpaceInteractionPreset } from "@/lib/community/space-interaction";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CommunityReplyForm({
  replyingToName,
  onCancel,
  onSubmit,
  preset: presetProp,
}: {
  replyingToName: string;
  onCancel: () => void;
  onSubmit: (body: string) => Promise<void>;
  preset?: SpaceInteractionPreset;
}) {
  const preset = presetProp ?? getSpaceInteractionPreset(null);
  const isPrayer = preset.mode === "prayer";
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!body.trim()) {
      setError(isPrayer ? "Please share your prayer." : "Please write a reply.");
      return;
    }
    startTransition(async () => {
      try {
        await onSubmit(body.trim());
        setBody("");
        onCancel();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not post reply");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 pl-3 border-l-2 border-brand-primary/20 space-y-2">
      <p className="text-xs text-brand-ink/60">
        Replying to <span className="font-medium text-brand-ink">{replyingToName}</span>
        <button
          type="button"
          onClick={onCancel}
          className="ml-2 inline-flex items-center text-brand-primary hover:underline"
        >
          <X className="h-3 w-3 mr-0.5" aria-hidden />
          Cancel
        </button>
      </p>
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={isPrayer ? preset.comments.placeholder : "Write a reply…"}
        rows={2}
        maxLength={2000}
        disabled={isPending}
        className="text-sm bg-white resize-none"
        autoFocus
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <Button type="submit" size="sm" variant="outline" disabled={isPending} className="rounded-full h-8">
        {isPending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" aria-hidden />
            Posting…
          </>
        ) : (
          isPrayer ? preset.comments.submitWritten : "Post reply"
        )}
      </Button>
    </form>
  );
}
