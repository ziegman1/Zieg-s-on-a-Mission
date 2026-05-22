"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { useCommunityNavPendingOptional } from "./community-nav-pending-context";
import { navTapBase, navTapPressed } from "./mission-hub-nav-styles";

type MissionHubNavLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  activeFromPath: boolean;
  prefetch?: boolean;
};

/**
 * Mission Hub navigation link with optimistic selected state on tap.
 */
export function MissionHubNavLink({
  href,
  activeFromPath,
  prefetch = true,
  className,
  onPointerDown,
  onClick,
  children,
  ...rest
}: MissionHubNavLinkProps) {
  const nav = useCommunityNavPendingOptional();
  const selected = nav ? nav.isSelected(href, activeFromPath) : activeFromPath;
  const pending = nav?.isPending(href) ?? false;

  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={cn(navTapBase, navTapPressed, className)}
      aria-current={selected ? "page" : undefined}
      data-nav-pending={pending ? "" : undefined}
      onPointerDown={(e) => {
        nav?.setPendingHref(href);
        onPointerDown?.(e);
      }}
      onClick={(e) => {
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </Link>
  );
}
