"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import type { CommunityComposerSpace } from "@/lib/community/composer-types";
import { publishedComposerSpaces } from "@/lib/community/composer-types";
import type { CommunityOwner } from "@/lib/community/owner-types";
import { getSpaceInteractionPreset } from "@/lib/community/space-interaction";
import type { CommunityPostType } from "@/lib/community/types";
import { CommunityCreatePostComposer } from "./community-create-post-composer";
import { CommunityCreateSpaceFlow } from "./community-create-space-flow";
import { cn } from "@/lib/utils";

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

type CreateMode = "space" | "post";

function resolveCreateMode(pathname: string): CreateMode | null {
  if (pathname === "/community/spaces") return "space";
  if (spaceSlugFromPath(pathname)) return "post";
  return null;
}

export function CommunityTopbarCreate({
  owner,
  composerSpaces,
}: {
  owner: CommunityOwner | null;
  composerSpaces: CommunityComposerSpace[];
}) {
  const pathname = usePathname();
  const [spaceOpen, setSpaceOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);

  const mode = resolveCreateMode(pathname);
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

  const canCreate =
    Boolean(owner) &&
    mode !== null &&
    (mode === "space" || (mode === "post" && published.length > 0));

  if (!canCreate) return null;

  const ariaLabel = mode === "space" ? "Create new space" : "Create new post";

  return (
    <>
      <button
        type="button"
        onClick={() => (mode === "space" ? setSpaceOpen(true) : setPostOpen(true))}
        className={cn(
          "relative inline-flex h-10 w-10 items-center justify-center rounded-full",
          "text-brand-ink/55 hover:text-brand-primary hover:bg-brand-surface/80",
          "transition-[transform,background-color,color] duration-75 touch-manipulation",
          "active:scale-[0.98] active:bg-black/[0.06]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35",
        )}
        aria-label={ariaLabel}
      >
        <Plus className="h-5 w-5" strokeWidth={2} aria-hidden />
      </button>

      {mode === "space" ? (
        <CommunityCreateSpaceFlow open={spaceOpen} onOpenChange={setSpaceOpen} />
      ) : (
        <CommunityCreatePostComposer
          open={postOpen}
          onOpenChange={setPostOpen}
          spaces={composerSpaces}
          defaultSpaceId={defaultSpaceId}
          defaultPostType={defaultPostType}
          owner={owner}
        />
      )}
    </>
  );
}
