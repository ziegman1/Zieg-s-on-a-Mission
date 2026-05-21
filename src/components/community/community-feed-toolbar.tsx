"use client";

import type { CommunityComposerSpace } from "@/lib/community/composer-types";
import type { CommunityOwner } from "@/lib/community/owner-types";
import type { CommunitySpace } from "@/lib/community/types";
import { MH } from "@/lib/community/hub-design";
import { getSpaceInteractionPreset } from "@/lib/community/space-interaction";
import { CommunityOwnerCompose } from "./community-owner-compose";
import { CommunitySpaceFilterRow } from "./community-space-filter-row";
import { cn } from "@/lib/utils";

/** Sticky filter pills + optional owner compose — sole context bar above the feed. */
export function CommunityFeedToolbar({
  spaces,
  activeSlug = null,
  owner = null,
  composerSpaces = [],
  defaultSpaceId,
  variant = "default",
  spaceType,
  spaceSlug,
}: {
  spaces: CommunitySpace[];
  activeSlug?: string | null;
  owner?: CommunityOwner | null;
  composerSpaces?: CommunityComposerSpace[];
  defaultSpaceId?: string;
  variant?: "default" | "ambient";
  spaceType?: string | null;
  spaceSlug?: string | null;
}) {
  const preset = getSpaceInteractionPreset(spaceType, spaceSlug);
  const showCompose = Boolean(owner && composerSpaces.length > 0);
  const isFiltered = activeSlug !== null;
  const ambient = variant === "ambient";

  return (
    <div
      className={cn(
        "sticky z-30 -mx-2 px-2 sm:-mx-3 sm:px-3",
        MH.stickyToolbarTop,
        "py-2 mb-1",
        ambient
          ? "bg-[#ebe8e4]/75 backdrop-blur-sm border-b border-black/[0.03]"
          : "bg-[#ebe8e4]/90 backdrop-blur-md supports-[backdrop-filter]:bg-[#ebe8e4]/75 border-b border-black/[0.04]",
      )}
    >
      <div className={cn("mx-auto w-full flex items-start gap-3", MH.feedMax)}>
        <div className="min-w-0 flex-1">
          {spaces.length > 0 ? (
            <CommunitySpaceFilterRow spaces={spaces} activeSlug={activeSlug} />
          ) : null}
        </div>
        {showCompose ? (
          <CommunityOwnerCompose
            spaces={composerSpaces}
            defaultSpaceId={defaultSpaceId}
            owner={owner}
            showCreateSpace={!isFiltered}
            composeLabel={preset.composeShortLabel}
            defaultPostType={preset.mode === "prayer" ? "prayer" : undefined}
          />
        ) : null}
      </div>
    </div>
  );
}
