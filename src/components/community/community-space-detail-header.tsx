import Link from "next/link";
import type { CommunitySpace } from "@/lib/community/types";
import { CommunitySpaceIcon } from "./community-space-icon";

export function CommunitySpaceDetailHeader({ space }: { space: CommunitySpace }) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-brand-primary/20 bg-gradient-to-br from-white/80 via-brand-surface to-brand-primary/10 px-6 py-10 sm:px-10 sm:py-12 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">
        <Link href="/community" className="hover:underline">
          Mission Hub
        </Link>
        <span className="text-brand-ink/40 mx-2" aria-hidden>
          /
        </span>
        <span>{space.title}</span>
      </p>
      <div className="mt-4 flex items-start gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-primary/15 text-brand-primary">
          <CommunitySpaceIcon icon={space.icon} className="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <h1 className="font-serif text-3xl sm:text-4xl text-brand-ink tracking-wide">
            {space.title}
          </h1>
          {space.description ? (
            <p className="mt-4 max-w-2xl text-lg text-brand-ink/85 leading-relaxed">
              {space.description}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
