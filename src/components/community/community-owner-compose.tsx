"use client";

import { useState } from "react";
import { LayoutGrid, PenLine, Plus } from "lucide-react";
import type { CommunityComposerSpace } from "@/lib/community/composer-types";
import type { CommunityOwner } from "@/lib/community/owner-types";
import type { CommunityPostType } from "@/lib/community/types";
import { CommunityCreatePostDialog } from "./community-create-post-dialog";
import { CommunityCreateSpaceDialog } from "./community-create-space-dialog";
import { cn } from "@/lib/utils";

/**
 * Owner compose: inline near feed filters (desktop), FAB (mobile).
 */
export function CommunityOwnerCompose({
  spaces,
  defaultSpaceId,
  owner = null,
  showCreateSpace = true,
  composeLabel = "New post",
  defaultPostType,
}: {
  spaces: CommunityComposerSpace[];
  defaultSpaceId?: string;
  owner?: CommunityOwner | null;
  /** Hub feed shows space + post; space filter shows post only */
  showCreateSpace?: boolean;
  composeLabel?: string;
  defaultPostType?: CommunityPostType;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [spaceOpen, setSpaceOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [postType, setPostType] = useState<CommunityPostType | undefined>(defaultPostType);

  const openPostOnly = !showCreateSpace;

  function openCompose(type?: CommunityPostType) {
    setPostType(type ?? defaultPostType);
    setPostOpen(true);
  }

  return (
    <>
      {/* Desktop: inline control */}
      <div className="hidden lg:flex items-center shrink-0">
        {openPostOnly ? (
          <button
            type="button"
            onClick={() => openCompose()}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary px-3.5 py-1.5 text-[13px] font-semibold text-white hover:bg-brand-primary/90 transition-colors"
          >
            <PenLine className="h-3.5 w-3.5" aria-hidden />
            {composeLabel}
          </button>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary px-3.5 py-1.5 text-[13px] font-semibold text-white hover:bg-brand-primary/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              New
            </button>
            {menuOpen ? (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40 cursor-default"
                  aria-label="Close"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-50 min-w-[10rem] rounded-xl bg-white py-1 shadow-lg ring-1 ring-black/[0.06]">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      openCompose();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-[13px] hover:bg-black/[0.03] text-left"
                  >
                    <PenLine className="h-3.5 w-3.5 text-brand-primary" aria-hidden />
                    {composeLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setSpaceOpen(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-[13px] hover:bg-black/[0.03] text-left"
                  >
                    <LayoutGrid className="h-3.5 w-3.5 text-brand-primary" aria-hidden />
                    Space
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* Mobile: FAB */}
      <button
        type="button"
        onClick={() => (openPostOnly ? openCompose() : setMenuOpen(true))}
        className={cn(
          "lg:hidden fixed z-30 flex h-12 w-12 items-center justify-center rounded-full",
          "bg-brand-primary text-white shadow-[0_4px_20px_rgba(30,54,68,0.25)]",
          "hover:bg-brand-primary/90 active:scale-95 transition-all",
          "right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))]",
        )}
        aria-label={openPostOnly ? composeLabel : "Create"}
      >
        <PenLine className="h-5 w-5" aria-hidden />
      </button>

      {menuOpen && !openPostOnly ? (
        <>
          <button
            type="button"
            className="lg:hidden fixed inset-0 z-40 bg-black/20"
            aria-label="Close"
            onClick={() => setMenuOpen(false)}
          />
          <div className="lg:hidden fixed z-50 right-4 bottom-[calc(7.5rem+env(safe-area-inset-bottom))] rounded-2xl bg-white py-2 shadow-xl ring-1 ring-black/[0.08] min-w-[11rem]">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                openCompose();
              }}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-left hover:bg-black/[0.03]"
            >
              <PenLine className="h-4 w-4 text-brand-primary" aria-hidden />
              {composeLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setSpaceOpen(true);
              }}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-left hover:bg-black/[0.03]"
            >
              <LayoutGrid className="h-4 w-4 text-brand-primary" aria-hidden />
              New space
            </button>
          </div>
        </>
      ) : null}

      {showCreateSpace ? (
        <CommunityCreateSpaceDialog open={spaceOpen} onOpenChange={setSpaceOpen} />
      ) : null}
      <CommunityCreatePostDialog
        open={postOpen}
        onOpenChange={setPostOpen}
        spaces={spaces}
        defaultSpaceId={defaultSpaceId}
        defaultPostType={postType}
        owner={owner}
      />
    </>
  );
}
