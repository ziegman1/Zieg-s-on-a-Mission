import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import type { CommunitySpace } from "@/lib/community/types";
import { CommunitySpaceIcon } from "./community-space-icon";

/** Filtered feed context — small header, posts visible immediately below filters. */
export function CommunitySpaceFeedHeaderCompact({ space }: { space: CommunitySpace }) {
  return (
    <header className="flex items-start gap-3 px-0.5 pb-1">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/12 text-brand-primary">
        <CommunitySpaceIcon icon={space.icon} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h1 className="text-base font-semibold text-brand-ink leading-snug">
            {space.title}
          </h1>
          <span className="text-[11px] text-brand-ink/45">
            {space.postCount === 1 ? "1 post" : `${space.postCount} posts`}
          </span>
        </div>
        {space.description ? (
          <p className="mt-0.5 text-xs text-brand-ink/60 leading-relaxed line-clamp-2">
            {space.description}
          </p>
        ) : null}
        <Link
          href="/community"
          className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-brand-primary hover:underline"
        >
          <LayoutGrid className="h-3 w-3" aria-hidden />
          All posts
        </Link>
      </div>
    </header>
  );
}
