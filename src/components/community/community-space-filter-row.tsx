"use client";

import { LayoutGrid } from "lucide-react";
import type { CommunitySpace } from "@/lib/community/types";
import { filterSpacesForFeedPills } from "@/lib/community/spiritual-room";
import { useCommunityNavPending } from "./community-nav-pending-context";
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
      <div
        className={cn(
          "flex gap-1.5 overflow-x-auto scrollbar-thin",
          "snap-x snap-mandatory [-webkit-overflow-scrolling:touch]",
          "lg:flex-wrap lg:overflow-visible lg:snap-none",
        )}
      >
        <MissionHubNavLink
          href={allHref}
          prefetch
          activeFromPath={isAll}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium shrink-0 snap-start",
            allSelected
              ? "bg-brand-ink/90 text-white"
              : "bg-white/50 text-brand-ink/65 hover:bg-white/75",
            navTapActive(allSelected, allPending),
            allSelected && "!bg-brand-ink/90 !text-white",
          )}
        >
          <LayoutGrid className="h-3.5 w-3.5 shrink-0" aria-hidden />
          All
        </MissionHubNavLink>
        {visibleSpaces.map((space) => (
          <CommunitySpacePill
            key={space.id}
            space={space}
            active={activeSlug === space.slug}
            linked
            variant="filter"
            className="snap-start"
          />
        ))}
      </div>
    </nav>
  );
}
