"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Bell } from "lucide-react";
import type { CommunityMemberProfile } from "@/lib/community/members";
import type { CommunityOwner } from "@/lib/community/owner-types";
import { MH } from "@/lib/community/hub-design";
import { CommunityNotificationsBell } from "./community-notifications-bell";
import { CommunityProfileMenu } from "./community-profile-menu";
import { cn } from "@/lib/utils";

export function CommunityTopbar({
  owner,
  member,
  siteName,
  accountImageUrl = null,
  notificationUserId = null,
  initialUnreadCount = 0,
}: {
  owner: CommunityOwner | null;
  member: CommunityMemberProfile | null;
  siteName: string;
  accountImageUrl?: string | null;
  notificationUserId?: string | null;
  initialUnreadCount?: number;
}) {
  const pathname = usePathname();
  const returnPath =
    pathname.startsWith("/community") && pathname !== "/community"
      ? pathname
      : "/community";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-black/[0.06] backdrop-blur-xl",
        "pt-[env(safe-area-inset-top)]",
        MH.bgElevated,
        "supports-[backdrop-filter]:bg-white/80",
      )}
    >
      <div
        className={cn(
          "mx-auto flex items-center gap-3 px-3 sm:px-4",
          MH.topbarH,
          "max-w-[92rem] w-full",
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Link
            href="/"
            className="hidden sm:inline-flex shrink-0 items-center justify-center h-9 w-9 rounded-full text-brand-ink/45 hover:text-brand-primary hover:bg-brand-surface/80 transition-colors"
            aria-label="Back to main site"
            title="Back to site"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>
          <Link href="/community" className="min-w-0 group">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-primary/80 leading-none">
              Mission Hub
            </p>
            <p className="text-sm font-serif text-brand-ink tracking-wide truncate group-hover:text-brand-primary transition-colors">
              {siteName}
            </p>
          </Link>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Link
            href="/"
            className="sm:hidden inline-flex items-center justify-center h-10 w-10 rounded-full text-brand-ink/50 hover:bg-brand-surface/80"
            aria-label="Back to site"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>
          {notificationUserId ? (
            <CommunityNotificationsBell
              recipientUserId={notificationUserId}
              initialUnreadCount={initialUnreadCount}
            />
          ) : (
            <span
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-ink/30"
              title="Sign in for notifications"
              aria-hidden
            >
              <Bell className="h-5 w-5" />
            </span>
          )}
          <CommunityProfileMenu
            owner={owner}
            member={member}
            accountImageUrl={accountImageUrl}
            returnPath={returnPath}
          />
        </div>
      </div>
    </header>
  );
}
