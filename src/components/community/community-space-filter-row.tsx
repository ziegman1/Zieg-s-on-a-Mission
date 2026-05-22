"use client";

import { LayoutGrid } from "lucide-react";
import type { CommunitySpace } from "@/lib/community/types";
import { filterSpacesForFeedPills } from "@/lib/community/spiritual-room";
import { useCommunityNavPending } from "./community-nav-pending-context";
import { CommunityHorizontalFadeScroll } from "./community-horizontal-fade-scroll";
import { MissionHubNavLink } from "./mission-hub-nav-link";
import { navTapActive } from "./mission-hub-nav-styles";
import { CommunitySpacePill } from "./community-space-pill";
import { cn } from "@/lib/utils";

export function CommunitySpaceFilterRow({
  spaces,
  activeSlug = null,
  className,
}: {
  spaces: CommunitySpace[];
  activeSlug?: string | null;
  className?: string;
}) {
  const isAll = activeSlug === null;
  const visibleSpaces = filterSpacesForFeedPills(spaces);
  const { isSelected, isPending } = useCommunityNavPending();
  const allHref = "/community";
  const allSelected = isSelected(allHref, isAll);
  const allPending = isPending(allHref);

  return (
    <nav aria-label="Filter by space" className={cn("w-full min-w-0", className)}>
      <CommunityHorizontalFadeScroll innerClassName="gap-1.5 py-0.5">
        <MissionHubNavLink
          href={allHref}
          prefetch
          activeFromPath={isAll}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium shrink-0 snap-start",
            "transition-all duration-150 ease-out touch-manipulation active:scale-[0.98]",
            allSelected
              ? "bg-brand-ink/88 text-white shadow-[0_2px_10px_rgba(30,54,68,0.12)] -translate-y-px"
              : "bg-white/45 text-brand-ink/55 ring-1 ring-black/[0.04] hover:bg-white/72",
            navTapActive(allSelected, allPending),
            allSelected && "!bg-brand-ink/88 !text-white",
          )}
        >
          <LayoutGrid className="h-3 w-3 shrink-0" aria-hidden />
          All
        </MissionHubNavLink>
        {visibleSpaces.map((space) => (
          <CommunitySpacePill
            key={space.id}
            space={space}
            active={activeSlug === space.slug}
            linked
            variant="filter"
          />
        ))}
      </CommunityHorizontalFadeScroll>
    </nav>
  );
}
