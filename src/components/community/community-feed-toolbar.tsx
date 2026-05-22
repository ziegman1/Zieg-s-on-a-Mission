"use client";

import type { CommunitySpace } from "@/lib/community/types";
import { MH } from "@/lib/community/hub-design";
import { CommunitySpaceFilterRow } from "./community-space-filter-row";
import { cn } from "@/lib/utils";

/** Sticky space filter pills — creation lives in page headers, not here. */
export function CommunityFeedToolbar({
  spaces,
  activeSlug = null,
  variant = "default",
}: {
  spaces: CommunitySpace[];
  activeSlug?: string | null;
  variant?: "default" | "ambient";
}) {
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
      <div className={cn("mx-auto w-full", MH.feedMax)}>
        {spaces.length > 0 ? (
          <CommunitySpaceFilterRow spaces={spaces} activeSlug={activeSlug} />
        ) : null}
      </div>
    </div>
  );
}
