"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import type { CommunityComposerSpace } from "@/lib/community/composer-types";
import { publishedComposerSpaces } from "@/lib/community/composer-types";
import type { CommunityOwner } from "@/lib/community/owner-types";
import { getSpaceInteractionPreset } from "@/lib/community/space-interaction";
import type { CommunityPostType } from "@/lib/community/types";
import { CommunityOwnerCreateBar } from "./community-owner-create-bar";

const RESERVED_SLUGS = new Set([
  "login",
  "join",
  "profile",
  "spaces",
  "settings",
]);

function spaceSlugFromPath(pathname: string): string | null {
  if (!pathname.startsWith("/community/")) return null;
  const slug = pathname.split("/")[2];
  if (!slug || RESERVED_SLUGS.has(slug)) return null;
  return slug;
}

export function CommunityTopbarCreate({
  owner,
  composerSpaces,
}: {
  owner: CommunityOwner | null;
  composerSpaces: CommunityComposerSpace[];
}) {
  const pathname = usePathname();
  const published = useMemo(
    () => publishedComposerSpaces(composerSpaces),
    [composerSpaces],
  );

  const spaceSlug = spaceSlugFromPath(pathname);
  const defaultSpaceId = useMemo(() => {
    if (!spaceSlug) return undefined;
    return published.find((s) => s.slug === spaceSlug)?.id;
  }, [spaceSlug, published]);

  const defaultPostType: CommunityPostType | undefined = useMemo(() => {
    if (!spaceSlug) return undefined;
    const preset = getSpaceInteractionPreset(null, spaceSlug);
    return preset.mode === "prayer" ? "prayer" : undefined;
  }, [spaceSlug]);

  if (!owner) return null;

  return (
    <CommunityOwnerCreateBar
      variant="topbar"
      spaces={composerSpaces}
      defaultSpaceId={defaultSpaceId}
      defaultPostType={defaultPostType}
      owner={owner}
      canCreatePost={published.length > 0}
    />
  );
}
