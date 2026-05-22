"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Loader2, MoreHorizontal, Trash2 } from "lucide-react";
import {
  deleteCommunityCommentAction,
  hideCommunityCommentAction,
  restoreCommunityCommentAction,
} from "@/app/(storefront)/community/comment-actions";
import type {
  CommunityPostComment,
  CommunityPostCommentThread,
} from "@/lib/community/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type CommentModerationResult = {
  threads: CommunityPostCommentThread[];
  commentCount: number;
};

export function CommunityCommentHiddenBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-amber-300/60 bg-amber-50 px-1.5 py-0.5",
        "text-[10px] font-semibold uppercase tracking-wide text-amber-800/90",
        className,
      )}
    >
      Hidden
    </span>
  );
}

export function CommunityCommentModerationMenu({
  comment,
  onComplete,
  className,
}: {
  comment: CommunityPostComment;
  onComplete: (result: CommentModerationResult) => void;
  className?: string;
}) {
  const [menuError, setMenuError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function runAction(
    action: () => Promise<
      | { ok: true; threads: CommunityPostCommentThread[]; commentCount: number }
      | { ok: false; error: string }
    >,
    closeDeleteDialog = false,
  ) {
    setMenuError(null);
    startTransition(async () => {
      const res = await action();
      if (!res.ok) {
        setMenuError(res.error);
        return;
      }
      if (closeDeleteDialog) setDeleteOpen(false);
      onComplete({ threads: res.threads, commentCount: res.commentCount });
    });
  }

  const isHidden = comment.status === "hidden";

  return (
    <div className={cn("relative shrink-0", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={isPending}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-full",
              "text-brand-ink/40 hover:text-brand-ink hover:bg-black/[0.05]",
              "transition-[transform,background-color] duration-75 touch-manipulation active:scale-[0.98]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30",
            )}
            aria-label="Moderate comment"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <MoreHorizontal className="h-3.5 w-3.5" aria-hidden />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[12rem]">
          {isHidden ? (
            <DropdownMenuItem
              onSelect={() =>
                runAction(() => restoreCommunityCommentAction(comment.id))
              }
            >
              <Eye className="h-4 w-4" aria-hidden />
              Restore
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onSelect={() =>
                runAction(() => hideCommunityCommentAction(comment.id))
              }
            >
              <EyeOff className="h-4 w-4" aria-hidden />
              Hide from public view
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete permanently
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {menuError ? (
        <p className="absolute right-0 top-full mt-1 z-10 text-[10px] text-red-600 whitespace-nowrap max-w-[10rem] truncate">
          {menuError}
        </p>
      ) : null}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent showCloseButton className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete permanently?</DialogTitle>
            <DialogDescription>
              This will permanently delete this prayer/comment. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={() =>
                runAction(() => deleteCommunityCommentAction(comment.id), true)
              }
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
