"use client";

import Link from "next/link";
import type { CommunitySpace } from "@/lib/community/types";
import { useCommunityPublishedSpaces } from "./community-published-spaces-context";
import { CommunitySpaceIcon } from "./community-space-icon";
import { MissionHubPageHeader } from "./mission-hub-page-header";

export function CommunitySpacesPageClient({
  spaces: spacesProp,
}: {
  spaces: CommunitySpace[];
}) {
  const spaces = useCommunityPublishedSpaces(spacesProp);
  return (
    <>
      <MissionHubPageHeader
        title="Spaces"
        subtitle="Rooms for prayer, updates, and connection"
      />

      <ul className="divide-y divide-black/[0.05] rounded-lg bg-white/60 overflow-hidden">
        {spaces.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-brand-ink/50">
            No published spaces yet.
          </li>
        ) : (
          spaces.map((space) => (
            <li key={space.id}>
              <Link
                href={`/community/${space.slug}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-black/[0.02] active:bg-black/[0.03] transition-colors touch-manipulation"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                  <CommunitySpaceIcon icon={space.icon} className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-brand-ink">{space.title}</span>
              </Link>
            </li>
          ))
        )}
      </ul>
    </>
  );
}
