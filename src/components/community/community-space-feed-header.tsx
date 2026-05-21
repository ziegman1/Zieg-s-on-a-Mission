import type { CommunitySpace } from "@/lib/community/types";
import { CommunityAppBackLink } from "./community-app-back-link";
import { CommunitySpaceIcon } from "./community-space-icon";

export function CommunitySpaceFeedHeader({ space }: { space: CommunitySpace }) {
  return (
    <header className="rounded-2xl border border-brand-primary/15 bg-white/95 shadow-sm overflow-hidden">
      <div className="px-4 pt-4 sm:px-5">
        <CommunityAppBackLink />
      </div>
      <div className="px-5 pb-5 sm:px-6 sm:pb-6 flex items-start gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-sm">
          <CommunitySpaceIcon icon={space.icon} className="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-primary/80">
            Space
          </p>
          <h1 className="font-serif text-2xl sm:text-[1.6rem] text-brand-ink tracking-wide leading-tight">
            {space.title}
          </h1>
          {space.description ? (
            <p className="mt-2 text-sm text-brand-ink/75 leading-relaxed">{space.description}</p>
          ) : null}
          <p className="mt-3 text-xs text-brand-ink/45">
            {space.postCount === 1 ? "1 post" : `${space.postCount} posts`} · Ministry family feed
          </p>
        </div>
      </div>
    </header>
  );
}
