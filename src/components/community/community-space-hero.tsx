import Image from "next/image";
import type { CommunitySpaceDetail } from "@/lib/community/space-experience";
import {
  getSpiritualHeroImageUrl,
  getSpiritualHeroSubtitle,
  getSpiritualHeroTitle,
  shouldRenderSpiritualCoverOverlay,
} from "@/lib/community/spiritual-room";
import { MH } from "@/lib/community/hub-design";
import { CommunitySpaceIcon } from "./community-space-icon";
import { cn } from "@/lib/utils";

/**
 * Cover image banner for spiritual rooms.
 * Designed covers (embedded typography) render full-bleed with object-contain — no crop.
 * Welcome body copy lives in CommunitySpaceWelcomeIntro below this block.
 */
export function CommunitySpaceHero({ space }: { space: CommunitySpaceDetail }) {
  const imageUrl = getSpiritualHeroImageUrl(space);
  const title = getSpiritualHeroTitle(space);
  const subtitle = getSpiritualHeroSubtitle(space);
  const showOverlay = shouldRenderSpiritualCoverOverlay(space);

  return (
    <header
      className={cn(
        "w-full overflow-hidden rounded-xl sm:rounded-2xl",
        "ring-1 ring-black/[0.04]",
        MH.bg,
      )}
      aria-label={showOverlay ? `${title} — cover` : `${title} cover image`}
    >
      <div className="relative w-full">
        <Image
          src={imageUrl}
          alt={showOverlay ? "" : title}
          width={2048}
          height={1152}
          priority
          unoptimized
          className="block w-full h-auto max-w-full object-contain object-center"
          sizes="(max-width: 52rem) 100vw, 52rem"
          style={{ width: "100%", height: "auto" }}
        />
        {showOverlay ? (
          <>
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black/55 via-black/20 to-transparent"
              aria-hidden
            />
            <div className="absolute inset-x-0 bottom-0 px-4 sm:px-6 pb-4 sm:pb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/25 ring-1 ring-white/20 backdrop-blur-[2px]">
                  <CommunitySpaceIcon icon={space.icon} className="h-3.5 w-3.5 text-white/95" />
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/75">
                  Mission Hub
                </span>
              </div>
              <h1 className="font-serif text-xl sm:text-2xl lg:text-[1.75rem] leading-[1.15] text-white tracking-wide max-w-2xl drop-shadow-sm">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-1.5 text-[13px] sm:text-sm text-white/88 leading-snug max-w-xl font-light line-clamp-2">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </header>
  );
}
