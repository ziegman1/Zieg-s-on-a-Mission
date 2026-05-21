"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Rows3, User } from "lucide-react";
import type { CommunitySpace } from "@/lib/community/types";
import { cn } from "@/lib/utils";
import { CommunitySpaceIcon } from "./community-space-icon";

function NavLink({
  href,
  active,
  children,
  icon,
  ambient = false,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  ambient?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-2.5 leading-tight transition-colors min-w-0",
        ambient ? "py-2 text-[12.5px] font-normal" : "py-1.5 text-[13px] font-medium",
        active
          ? ambient
            ? "bg-brand-primary/[0.06] text-brand-primary/85"
            : "bg-brand-primary/10 text-brand-primary"
          : ambient
            ? "text-brand-ink/48 hover:bg-black/[0.025] hover:text-brand-ink/72"
            : "text-brand-ink/60 hover:bg-black/[0.04] hover:text-brand-ink",
      )}
      aria-current={active ? "page" : undefined}
    >
      {icon}
      <span className="truncate">{children}</span>
    </Link>
  );
}

export function CommunityLeftNav({
  publishedSpaces,
  plannedSpaces = [],
  showAdminCreate = false,
  activeSlug: activeSlugProp = null,
  variant = "default",
}: {
  publishedSpaces: CommunitySpace[];
  plannedSpaces?: CommunitySpace[];
  showAdminCreate?: boolean;
  activeSlug?: string | null;
  variant?: "default" | "ambient";
}) {
  const ambient = variant === "ambient";
  const pathname = usePathname();
  const isAllFeed = pathname === "/community";
  const activeSlug =
    activeSlugProp ??
    (pathname.startsWith("/community/") &&
    !["login", "join", "profile", "spaces"].includes(
      pathname.replace("/community/", "").split("/")[0] ?? "",
    )
      ? pathname.replace("/community/", "").split("/")[0]
      : null);

  return (
    <nav
      className={cn(
        "sticky top-14 z-20 hidden lg:flex lg:flex-col max-h-[calc(100dvh-3.5rem)] shrink-0",
        ambient ? "w-[9.75rem]" : "w-[10.5rem]",
      )}
      aria-label="Mission Hub"
    >
      <div className={cn("flex flex-col min-h-0 flex-1", ambient ? "py-2" : "py-1")}>
        <Link
          href="/community"
          className={cn(
            "px-2.5 tracking-wide transition-colors",
            ambient
              ? "py-1.5 font-serif text-[14px] text-brand-ink/75 hover:text-brand-primary/90"
              : "py-2 font-serif text-[15px] text-brand-ink hover:text-brand-primary",
          )}
        >
          Mission Hub
        </Link>

        <div
          className={cn(
            "overflow-y-auto flex-1 min-h-0 px-1.5",
            ambient ? "mt-2 space-y-1" : "mt-1 space-y-0.5",
          )}
        >
          <NavLink
            href="/community"
            active={isAllFeed && activeSlug === null}
            ambient={ambient}
            icon={<Rows3 className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />}
          >
            All posts
          </NavLink>

          {publishedSpaces.map((space) => (
            <NavLink
              key={space.id}
              href={`/community/${space.slug}`}
              active={activeSlug === space.slug}
              ambient={ambient}
              icon={
                <CommunitySpaceIcon
                  icon={space.icon}
                  className={cn("h-3.5 w-3.5 shrink-0", ambient ? "opacity-65" : "opacity-80")}
                />
              }
            >
              {space.title}
            </NavLink>
          ))}

          {plannedSpaces.map((space) => (
            <span
              key={space.id}
              className={cn(
                "flex items-center gap-2 px-2.5 truncate",
                ambient ? "py-2 text-[11.5px] text-brand-ink/30" : "py-1.5 text-[12px] text-brand-ink/35",
              )}
            >
              <CommunitySpaceIcon icon={space.icon} className="h-3.5 w-3.5 shrink-0" />
              {space.title}
            </span>
          ))}
        </div>

        <div
          className={cn(
            "mt-auto pt-3 px-1.5 space-y-1",
            ambient ? "border-t border-black/[0.03]" : "border-t border-black/[0.05]",
          )}
        >
          <NavLink
            href="/community/settings"
            active={pathname.startsWith("/community/settings")}
            ambient={ambient}
            icon={<User className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />}
          >
            Settings
          </NavLink>
          {showAdminCreate ? (
            <Link
              href="/admin/community"
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 transition-colors",
                ambient
                  ? "py-2 text-[11.5px] text-brand-ink/42 hover:text-brand-primary/85"
                  : "py-1.5 text-[12px] font-medium text-brand-ink/50 hover:text-brand-primary",
              )}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Admin
            </Link>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
