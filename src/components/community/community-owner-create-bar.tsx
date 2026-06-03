"use client";

import { useState } from "react";
import { LayoutGrid, PenLine, Plus } from "lucide-react";
import type { CommunityComposerSpace } from "@/lib/community/composer-types";
import type { CommunityOwner } from "@/lib/community/owner-types";
import type { CommunityPostType } from "@/lib/community/types";
import { CommunityBottomSheet } from "./community-bottom-sheet";
import { CommunityCreatePostDialog } from "./community-create-post-dialog";
import { CommunityCreateSpaceDialog } from "./community-create-space-dialog";
import { cn } from "@/lib/utils";

function CreateMenuItems({
  onSpace,
  onPost,
  postDisabled,
  className,
}: {
  onSpace: () => void;
  onPost: () => void;
  postDisabled?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("py-1.5", className)} role="menu">
      <button
        type="button"
        role="menuitem"
        onClick={onSpace}
        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-brand-ink hover:bg-brand-surface/80 text-left"
      >
        <LayoutGrid className="h-4 w-4 text-brand-primary" aria-hidden />
        Create space
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={onPost}
        disabled={postDisabled}
        className={cn(
          "flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-left",
          postDisabled
            ? "text-brand-ink/35 cursor-not-allowed"
            : "text-brand-ink hover:bg-brand-surface/80",
        )}
      >
        <PenLine className="h-4 w-4 text-brand-primary" aria-hidden />
        Create post
      </button>
      {postDisabled ? (
        <p className="px-4 pb-2 text-[11px] text-brand-ink/45 leading-snug">
          Publish a space first to create posts.
        </p>
      ) : null}
    </div>
  );
}

export function CommunityOwnerCreateBar({
  spaces,
  variant,
  defaultSpaceId,
  defaultPostType,
  owner = null,
  canCreatePost = true,
  className,
}: {
  spaces: CommunityComposerSpace[];
  /** hub: Create menu; space: New post only; topbar: icon + menu for Mission Hub header */
  variant: "hub" | "space" | "topbar";
  defaultSpaceId?: string;
  defaultPostType?: CommunityPostType;
  owner?: CommunityOwner | null;
  /** When false, post option is disabled (no published spaces). */
  canCreatePost?: boolean;
  className?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [spaceOpen, setSpaceOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  function openSpace() {
    closeMenu();
    setSpaceOpen(true);
  }

  function openPost() {
    if (!canCreatePost) return;
    closeMenu();
    setPostOpen(true);
  }

  if (variant === "space") {
    return (
      <div className={cn("flex justify-end", className)}>
        <button
          type="button"
          onClick={() => setPostOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-brand-primary text-white px-4 py-2.5 text-sm font-semibold shadow-md hover:bg-brand-primary/90 transition-colors"
        >
          <PenLine className="h-4 w-4" aria-hidden />
          New post
        </button>
        <CommunityCreatePostDialog
          open={postOpen}
          onOpenChange={setPostOpen}
          spaces={spaces}
          defaultSpaceId={defaultSpaceId}
          defaultPostType={defaultPostType}
          owner={owner}
        />
      </div>
    );
  }

  const isTopbar = variant === "topbar";

  return (
    <div className={cn("relative flex justify-end", className)}>
      <div className="relative">
        {isTopbar ? (
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Create"
            className={cn(
              "relative inline-flex h-10 w-10 items-center justify-center rounded-full",
              "text-brand-ink/55 hover:text-brand-primary hover:bg-brand-surface/80",
              "transition-[transform,background-color,color] duration-75 touch-manipulation",
              "active:scale-[0.98] active:bg-black/[0.06]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35",
              menuOpen && "bg-brand-surface/80 text-brand-primary",
            )}
          >
            <Plus className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="inline-flex items-center gap-2 rounded-full bg-brand-primary text-white pl-3 pr-4 py-2.5 text-sm font-semibold shadow-md hover:bg-brand-primary/90 transition-colors"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <Plus className="h-5 w-5" aria-hidden />
            </span>
            Create
          </button>
        )}

        {menuOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-[55] cursor-default hidden lg:block"
              aria-label="Close menu"
              onClick={closeMenu}
            />
            <div
              role="menu"
              className={cn(
                "absolute right-0 top-full mt-2 z-[60] min-w-[11rem] rounded-2xl border border-brand-primary/15 bg-white shadow-lg",
                "hidden lg:block",
              )}
            >
              <CreateMenuItems
                onSpace={openSpace}
                onPost={openPost}
                postDisabled={!canCreatePost}
              />
            </div>
          </>
        ) : null}
      </div>

      <div className="lg:hidden">
        <CommunityBottomSheet
          open={menuOpen}
          onOpenChange={setMenuOpen}
          title="Create"
          description="Add a new space or post to Mission Hub."
          className="max-h-[min(40dvh,320px)]"
        >
          <CreateMenuItems
            onSpace={openSpace}
            onPost={openPost}
            postDisabled={!canCreatePost}
            className="px-1 pb-2"
          />
        </CommunityBottomSheet>
      </div>

      <CommunityCreateSpaceDialog open={spaceOpen} onOpenChange={setSpaceOpen} />
      <CommunityCreatePostDialog
        open={postOpen}
        onOpenChange={setPostOpen}
        spaces={spaces}
        defaultSpaceId={defaultSpaceId}
        defaultPostType={defaultPostType}
        owner={owner}
      />
    </div>
  );
}
