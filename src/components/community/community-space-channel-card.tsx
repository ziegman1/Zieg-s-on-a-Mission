import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { CommunitySpace } from "@/lib/community/types";
import { CommunitySpaceIcon } from "./community-space-icon";

export function CommunitySpaceChannelCard({ space }: { space: CommunitySpace }) {
  if (space.status !== "published") return null;

  return (
    <Link
      href={`/community/${space.slug}`}
      className="group flex items-center gap-4 rounded-2xl border border-brand-primary/15 bg-white/95 p-4 shadow-sm hover:border-brand-primary/35 hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-primary/15 text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
        <CommunitySpaceIcon icon={space.icon} className="h-7 w-7" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-serif text-lg text-brand-ink tracking-wide group-hover:text-brand-primary transition-colors">
          {space.title}
        </p>
        {space.description ? (
          <p className="mt-1 text-sm text-brand-ink/65 leading-relaxed line-clamp-2">
            {space.description}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-brand-ink/45">
          Open space · {space.postCount === 1 ? "1 post" : `${space.postCount} posts`}
        </p>
      </div>
      <ChevronRight
        className="h-5 w-5 shrink-0 text-brand-primary/50 group-hover:text-brand-primary transition-colors"
        aria-hidden
      />
    </Link>
  );
}
