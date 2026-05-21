"use client";

import { useState } from "react";
import { LayoutGrid, PenLine, Plus } from "lucide-react";
import type { CommunityComposerSpace } from "@/lib/community/composer-types";
import type { CommunityOwner } from "@/lib/community/owner-types";
import { CommunityCreatePostDialog } from "./community-create-post-dialog";
import { CommunityCreateSpaceDialog } from "./community-create-space-dialog";
import { cn } from "@/lib/utils";

export function CommunityOwnerCreateBar({
  spaces,
  variant,
  defaultSpaceId,
  owner = null,
  className,
}: {
  spaces: CommunityComposerSpace[];
  /** hub: Create menu with space + post; space: New post only */
  variant: "hub" | "space";
  defaultSpaceId?: string;
  owner?: CommunityOwner | null;
  className?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [spaceOpen, setSpaceOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);

  function openSpace() {
    setMenuOpen(false);
    setSpaceOpen(true);
  }

  function openPost() {
    setMenuOpen(false);
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
          owner={owner}
        />
      </div>
    );
  }

  return (
    <div className={cn("relative flex justify-end", className)}>
      <div className="relative">
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
        {menuOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            />
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 z-50 min-w-[11rem] rounded-2xl border border-brand-primary/15 bg-white py-1.5 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={openSpace}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-brand-ink hover:bg-brand-surface/80 text-left"
              >
                <LayoutGrid className="h-4 w-4 text-brand-primary" aria-hidden />
                Create space
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={openPost}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-brand-ink hover:bg-brand-surface/80 text-left"
              >
                <PenLine className="h-4 w-4 text-brand-primary" aria-hidden />
                Create post
              </button>
            </div>
          </>
        ) : null}
      </div>

      <CommunityCreateSpaceDialog open={spaceOpen} onOpenChange={setSpaceOpen} />
      <CommunityCreatePostDialog
        open={postOpen}
        onOpenChange={setPostOpen}
        spaces={spaces}
        defaultSpaceId={defaultSpaceId}
        owner={owner}
      />
    </div>
  );
}
