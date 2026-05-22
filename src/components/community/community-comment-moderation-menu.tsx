"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Loader2, MoreHorizontal, Trash2 } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
  deleteCommunityCommentAction,
  hideCommunityCommentAction,
  restoreCommunityCommentAction,
} from "@/app/(storefront)/community/comment-actions";
import type {
  CommunityPostComment,
  CommunityPostCommentThread,
} from "@/lib/community/types";
import {
  MH_LAYER_MENU,
  MH_LAYER_SHEET_DIALOG,
  MH_LAYER_TOAST,
} from "@/lib/community/mission-hub-layering";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommunityPrayerToast } from "./community-prayer-toast";
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

function ModerationDeleteDialog({
  open,
  onOpenChange,
  isPending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onConfirm: () => void;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 bg-black/50",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
          style={{ zIndex: MH_LAYER_SHEET_DIALOG }}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed top-[50%] left-[50%] grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%]",
            "gap-4 rounded-lg border bg-background p-6 shadow-lg outline-none sm:max-w-md",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            "data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          )}
          style={{ zIndex: MH_LAYER_SHEET_DIALOG }}
        >
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <DialogPrimitive.Title className="text-lg font-semibold leading-none">
              Delete permanently?
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-muted-foreground">
              This will permanently delete this prayer/comment. This cannot be undone.
            </DialogPrimitive.Description>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={isPending} onClick={onConfirm}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function showToast(message: string) {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 2800);
  }

  function runAction(
    action: () => Promise<
      | { ok: true; threads: CommunityPostCommentThread[]; commentCount: number }
      | { ok: false; error: string }
    >,
    options: { successMessage: string; closeDeleteDialog?: boolean },
  ) {
    setMenuError(null);
    setMenuOpen(false);
    startTransition(async () => {
      const res = await action();
      if (!res.ok) {
        setMenuError(res.error);
        return;
      }
      if (options.closeDeleteDialog) setDeleteOpen(false);
      onComplete({ threads: res.threads, commentCount: res.commentCount });
      showToast(options.successMessage);
    });
  }

  const isHidden = comment.status === "hidden";

  return (
    <div
      className={cn("relative shrink-0", className)}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <DropdownMenu modal={false} open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={isPending}
            className={cn(
              "relative inline-flex h-10 w-10 items-center justify-center rounded-full",
              "text-brand-ink/55 hover:text-brand-ink hover:bg-black/[0.06]",
              "ring-1 ring-black/[0.06] bg-white/80",
              "transition-[transform,background-color] duration-75 touch-manipulation active:scale-[0.96]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35",
            )}
            aria-label="Moderate comment"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <MoreHorizontal className="h-4 w-4" aria-hidden />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="bottom"
          sideOffset={6}
          collisionPadding={12}
          className="min-w-[12.5rem]"
          style={{ zIndex: MH_LAYER_MENU }}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {isHidden ? (
            <DropdownMenuItem
              className="min-h-11 touch-manipulation"
              onSelect={(e) => {
                e.preventDefault();
                runAction(() => restoreCommunityCommentAction(comment.id), {
                  successMessage: "Prayer restored for everyone",
                });
              }}
            >
              <Eye className="h-4 w-4" aria-hidden />
              Restore
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="min-h-11 touch-manipulation"
              onSelect={(e) => {
                e.preventDefault();
                runAction(() => hideCommunityCommentAction(comment.id), {
                  successMessage: "Hidden from public view",
                });
              }}
            >
              <EyeOff className="h-4 w-4" aria-hidden />
              Hide from public view
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="min-h-11 touch-manipulation"
            onSelect={(e) => {
              e.preventDefault();
              setMenuOpen(false);
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete permanently
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {menuError ? (
        <p className="absolute right-0 top-full mt-1 z-10 max-w-[10rem] truncate whitespace-nowrap text-[10px] text-red-600">
          {menuError}
        </p>
      ) : null}

      <ModerationDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        isPending={isPending}
        onConfirm={() =>
          runAction(() => deleteCommunityCommentAction(comment.id), {
            successMessage: "Prayer deleted",
            closeDeleteDialog: true,
          })
        }
      />

      <CommunityPrayerToast
        message={toastMessage ?? ""}
        visible={Boolean(toastMessage)}
        style={{ zIndex: MH_LAYER_TOAST }}
      />
    </div>
  );
}
