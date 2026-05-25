import type { ReactNode } from "react";
import type { CommunityComposerSpace } from "@/lib/community/composer-types";
import type { AdminMembersHubPreview } from "@/lib/community/admin-members-preview-types";
import type { CommunityMemberProfile } from "@/lib/community/members";
import type { CommunityOwner } from "@/lib/community/owner-types";
import { MH } from "@/lib/community/hub-design";
import { CommunityBottomNav } from "./community-bottom-nav";
import { CommunityInstallHint } from "./community-install-hint";
import { CommunityTopbar } from "./community-topbar";
import {
  MissionHubPullToRefreshMain,
  MissionHubRefreshRoot,
} from "./mission-hub-live-layer";
import { MissionHubNavBoundary } from "./mission-hub-nav-boundary";
import { MissionHubStandaloneInit } from "./mission-hub-standalone-init";
import { MissionHubSwRegister } from "./mission-hub-sw-register";
import { cn } from "@/lib/utils";

/**
 * Mission Hub app chrome: dedicated top bar + bottom nav, no storefront header/footer.
 */
export function MissionHubShell({
  owner,
  member,
  siteName,
  showBottomNav = true,
  showInstallHint = true,
  accountImageUrl = null,
  notificationUserId = null,
  initialUnreadCount = 0,
  composerSpaces = [],
  membersPreview = null,
  children,
}: {
  owner: CommunityOwner | null;
  member: CommunityMemberProfile | null;
  siteName: string;
  /** Auth-focused pages can hide bottom nav */
  showBottomNav?: boolean;
  /** Login/join hide install hint */
  showInstallHint?: boolean;
  accountImageUrl?: string | null;
  notificationUserId?: string | null;
  initialUnreadCount?: number;
  composerSpaces?: CommunityComposerSpace[];
  membersPreview?: AdminMembersHubPreview | null;
  children: ReactNode;
}) {
  const signedIn = Boolean(owner ?? member);
  return (
    <div
      className={cn(
        "mission-hub-root min-h-dvh flex flex-col text-brand-ink",
        MH.bg,
      )}
    >
      <MissionHubStandaloneInit />
      <MissionHubSwRegister />
      <MissionHubRefreshRoot
        notificationUserId={notificationUserId}
        initialUnreadCount={initialUnreadCount}
      >
        <CommunityTopbar
          owner={owner}
          member={member}
          siteName={siteName}
          accountImageUrl={accountImageUrl}
          notificationUserId={notificationUserId}
          initialUnreadCount={initialUnreadCount}
          composerSpaces={composerSpaces}
          membersPreview={membersPreview}
        />
        <MissionHubNavBoundary>
          <MissionHubPullToRefreshMain>
            <main
              className={cn(
                "flex-1 w-full mission-hub-scroll",
                showBottomNav ? MH.bottomNavH : "pb-6",
              )}
            >
              {showInstallHint ? <CommunityInstallHint signedIn={signedIn} /> : null}
              {children}
            </main>
          </MissionHubPullToRefreshMain>
          {showBottomNav ? <CommunityBottomNav /> : null}
        </MissionHubNavBoundary>
      </MissionHubRefreshRoot>
    </div>
  );
}
