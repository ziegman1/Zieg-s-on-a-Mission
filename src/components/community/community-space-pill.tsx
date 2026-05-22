"use client";

import type { CommunitySpace } from "@/lib/community/types";
import { useCommunityNavPendingOptional } from "./community-nav-pending-context";
import { MissionHubNavLink } from "./mission-hub-nav-link";
import { navTapActive } from "./mission-hub-nav-styles";
import { cn } from "@/lib/utils";
import { CommunitySpaceIcon } from "./community-space-icon";

export function CommunitySpacePill({
  space,
  active = false,
  linked = true,
  variant = "filter",
  className,
}: {
  space: CommunitySpace;
  active?: boolean;
  linked?: boolean;
  variant?: "filter" | "nav";
  className?: string;
}) {
  const nav = useCommunityNavPendingOptional();
  const href = linked && space.status === "published" ? `/community/${space.slug}` : undefined;
  const isFilter = variant === "filter";

  const inner = isFilter ? (
    <>
      <CommunitySpaceIcon icon={space.icon} className="h-3.5 w-3.5 shrink-0 opacity-90" />
      <span className="truncate max-w-[8.5rem]">{space.title}</span>
    </>
  ) : (
    <>
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          active ? "bg-white/25 text-white" : "bg-brand-primary/15 text-brand-primary",
        )}
      >
        <CommunitySpaceIcon icon={space.icon} className="h-3.5 w-3.5" />
      </span>
      <span className="truncate max-w-[9rem]">{space.title}</span>
    </>
  );

  const pillClass = cn(
    "inline-flex items-center gap-1.5 font-medium shrink-0",
    isFilter ? "rounded-full px-3 py-1 text-[13px]" : "rounded-full px-3 py-1.5 text-sm gap-2",
    className,
    !linked && space.status === "coming_soon" && "opacity-60 cursor-default",
  );

  if (href) {
    const pending = nav?.isPending(href) ?? false;
    const selected = nav ? nav.isSelected(href, active) : active;
    return (
      <MissionHubNavLink
        href={href}
        prefetch
        activeFromPath={active}
        className={cn(
          pillClass,
          selected
            ? "bg-brand-ink/88 text-white"
            : "bg-white/50 text-brand-ink/62 hover:bg-white/72 hover:text-brand-ink/85",
          !selected && navTapActive(false, pending),
          selected && "!bg-brand-ink/88 !text-white",
        )}
      >
        {inner}
      </MissionHubNavLink>
    );
  }

  return (
    <span
      className={cn(
        pillClass,
        active ? "bg-brand-ink/88 text-white" : "bg-white/50 text-brand-ink/62",
      )}
    >
      {inner}
    </span>
  );
}
