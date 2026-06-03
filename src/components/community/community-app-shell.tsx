"use client";

import type { ReactNode } from "react";
import type { CommunityComposerSpace } from "@/lib/community/composer-types";
import type { CommunityOwner } from "@/lib/community/owner-types";
import type { CommunitySpaceDetail } from "@/lib/community/space-experience";
import { isSpiritualRoom, filterSpacesForFeedPills } from "@/lib/community/spiritual-room";
import type { CommunitySpace } from "@/lib/community/types";
import { MH } from "@/lib/community/hub-design";
import { CommunityFeedShell } from "./community-feed-shell";
import { CommunityFeedToolbar } from "./community-feed-toolbar";
import { CommunityLeftNav } from "./community-left-nav";
import { useCommunityPublishedSpaces } from "./community-published-spaces-context";
import { cn } from "@/lib/utils";

export function CommunityAppShell({
  publishedSpaces,
  plannedSpaces = [],
  showAdminCreate = false,
  activeSlug = null,
  owner = null,
  composerSpaces = [],
  defaultSpaceId,
  spaceDetail = null,
  children,
}: {
  publishedSpaces: CommunitySpace[];
  plannedSpaces?: CommunitySpace[];
  showAdminCreate?: boolean;
  activeSlug?: string | null;
  owner?: CommunityOwner | null;
  composerSpaces?: CommunityComposerSpace[];
  defaultSpaceId?: string;
  /** When set on a space page, enables spiritual room layout (hero, soft chrome). */
  spaceDetail?: CommunitySpaceDetail | null;
  children: ReactNode;
}) {
  const livePublishedSpaces = useCommunityPublishedSpaces(publishedSpaces);
  const spiritual = spaceDetail
    ? isSpiritualRoom(spaceDetail.experience.spaceType, spaceDetail.slug)
    : false;
  const pillSpaces = spiritual
    ? filterSpacesForFeedPills(livePublishedSpaces)
    : livePublishedSpaces;

  return (
    <div className={cn("w-full px-2 sm:px-3 pt-1 pb-3", MH.bottomNavH, "lg:pb-4")}>
      <div className="max-w-[92rem] mx-auto flex gap-0 lg:gap-5">
        <CommunityLeftNav
          publishedSpaces={livePublishedSpaces}
          plannedSpaces={plannedSpaces}
          showAdminCreate={showAdminCreate}
          activeSlug={activeSlug}
          variant={spiritual ? "ambient" : "default"}
        />

        <div className="min-w-0 flex-1 flex flex-col">
          <CommunityFeedToolbar
            spaces={pillSpaces}
            activeSlug={activeSlug}
            variant={spiritual ? "ambient" : "default"}
          />

          <CommunityFeedShell className={spiritual ? "spiritual-feed" : undefined}>
            {children}
          </CommunityFeedShell>
        </div>
      </div>
    </div>
  );
}
