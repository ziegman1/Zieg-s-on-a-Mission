"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Loader2, MoreHorizontal, Pencil, Share2, Undo2 } from "lucide-react";
import {
  archiveCommunityPostAction,
  unpublishCommunityPostAction,
} from "@/app/admin/community/post-actions";
import type { CommunityComposerSpace } from "@/lib/community/composer-types";
import type { CommunityOwner } from "@/lib/community/owner-types";
import type { CommunityPostFeedItem } from "@/lib/community/types";
import { CommunityEditPostDialog } from "./community-edit-post-dialog";
import { CommunityPostShareDialog } from "./community-post-share-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function CommunityPostOwnerMenu({
  post,
  owner,
  composerSpaces,
  onPostUpdated,
  onPostRemoved,
  className,
}: {
  post: CommunityPostFeedItem;
  owner: CommunityOwner;
  composerSpaces: CommunityComposerSpace[];
  onPostUpdated: (next: CommunityPostFeedItem) => void;
  onPostRemoved: () => void;
  className?: string;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  /** Hub feed only lists published posts in published spaces */
  const canUnpublish = true;

  function runQuickAction(
    action: () => Promise<{ ok: true; removedFromFeed: true } | { ok: false; error: string }>,
  ) {
    setMenuError(null);
    startTransition(async () => {
      const res = await action();
      if (!res.ok) {
        setMenuError(res.error);
        return;
      }
      onPostRemoved();
      router.refresh();
    });
  }

  return (
    <>
      <div className={cn("relative shrink-0", className)}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={isPending}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-full",
                "text-brand-ink/45 hover:text-brand-ink hover:bg-black/[0.05] transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30",
              )}
              aria-label="Post options"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <MoreHorizontal className="h-4 w-4" aria-hidden />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[11rem]">
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" aria-hidden />
              Edit post
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setShareOpen(true)}>
              <Share2 className="h-4 w-4" aria-hidden />
              Share to Facebook
            </DropdownMenuItem>
            {canUnpublish ? (
              <DropdownMenuItem
                onSelect={() => runQuickAction(() => unpublishCommunityPostAction(post.id))}
              >
                <Undo2 className="h-4 w-4" aria-hidden />
                Unpublish (draft)
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => runQuickAction(() => archiveCommunityPostAction(post.id))}
            >
              <Archive className="h-4 w-4" aria-hidden />
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {menuError ? (
          <p className="absolute right-0 top-full mt-1 text-[10px] text-red-600 whitespace-nowrap z-10">
            {menuError}
          </p>
        ) : null}
      </div>

      <CommunityPostShareDialog
        postId={post.id}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />

      <CommunityEditPostDialog
        postId={post.id}
        open={editOpen}
        onOpenChange={setEditOpen}
        spaces={composerSpaces}
        owner={owner}
        onSaved={(patch, visibleInPublishedFeed) => {
          if (!visibleInPublishedFeed) {
            onPostRemoved();
            router.refresh();
            return;
          }
          onPostUpdated({ ...post, ...patch });
          router.refresh();
        }}
        onRemovedFromFeed={() => {
          onPostRemoved();
          router.refresh();
        }}
      />
    </>
  );
}
