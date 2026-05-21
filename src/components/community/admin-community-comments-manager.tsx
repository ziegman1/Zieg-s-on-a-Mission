"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { moderateCommentAction } from "@/app/admin/community/comment-actions";
import type { AdminCommunityCommentRow } from "@/lib/community/comments";
import type { CommunityCommentStatus } from "@/lib/community/types";
import { formatCommunityPostDate } from "@/lib/community/format-post-date";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<CommunityCommentStatus, string> = {
  published: "bg-emerald-900/40 text-emerald-200 border-emerald-700/50",
  hidden: "bg-amber-900/40 text-amber-200 border-amber-700/50",
  archived: "bg-zinc-800 text-zinc-400 border-zinc-600",
};

export function AdminCommunityCommentsManager({
  initialComments,
}: {
  initialComments: AdminCommunityCommentRow[];
}) {
  const [comments, setComments] = useState(initialComments);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function updateLocal(id: string, status: CommunityCommentStatus) {
    setComments((list) =>
      list.map((c) => (c.id === id ? { ...c, status } : c)),
    );
  }

  function moderate(id: string, status: CommunityCommentStatus) {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const res = await moderateCommentAction(id, status);
      setPendingId(null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      updateLocal(id, status);
    });
  }

  if (comments.length === 0) {
    return (
      <p className="text-zinc-400 text-sm">No comments yet. They will appear here when visitors comment on published posts.</p>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-red-400 text-sm">{error}</p> : null}
      <ul className="space-y-3">
        {comments.map((c) => {
          const busy = pendingId === c.id;
          return (
            <li
              key={c.id}
              className="rounded-lg border border-brand-primary/25 bg-zinc-900/80 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-brand-accent">{c.displayName}</span>
                    <span
                      className={cn(
                        "text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border",
                        STATUS_STYLES[c.status],
                      )}
                    >
                      {c.status}
                    </span>
                    {c.parentCommentId ? (
                      <span className="text-[10px] text-zinc-500 uppercase">Reply</span>
                    ) : null}
                  </div>
                  <p className="text-xs text-zinc-400">
                    <Link
                      href={`/community/${c.spaceSlug}`}
                      className="text-brand-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {c.spaceTitle}
                    </Link>
                    {" · "}
                    {c.postTitle?.trim() || "Untitled post"}
                    {" · "}
                    {formatCommunityPostDate(c.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {c.status !== "published" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => moderate(c.id, "published")}
                      className="h-8 text-xs"
                    >
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Restore"}
                    </Button>
                  ) : null}
                  {c.status !== "hidden" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => moderate(c.id, "hidden")}
                      className="h-8 text-xs"
                    >
                      Hide
                    </Button>
                  ) : null}
                  {c.status !== "archived" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => moderate(c.id, "archived")}
                      className="h-8 text-xs text-zinc-400"
                    >
                      Archive
                    </Button>
                  ) : null}
                </div>
              </div>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{c.body}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
