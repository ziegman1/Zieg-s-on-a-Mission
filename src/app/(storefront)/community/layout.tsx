import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { MissionHubShell } from "@/components/community/mission-hub-shell";
import { CommunityPublishedSpacesProvider } from "@/components/community/community-published-spaces-context";
import { getCurrentCommunityMember } from "@/lib/community/members";
import { getAdminMembersHubPreview } from "@/lib/community/admin-members-preview";
import { countUnreadNotifications } from "@/lib/community/notifications";
import { listComposerSpacesForOwner } from "@/lib/community/composer-spaces";
import { getCurrentCommunityOwner } from "@/lib/community/owner";
import { listPublishedCommunitySpaces } from "@/lib/community/spaces";
import { MISSION_HUB_PWA } from "@/lib/community/mission-hub-pwa";
import { DEFAULT_SITE_COPY } from "@/data/site-copy-defaults";
import { getSiteCopy } from "@/lib/site-copy";
import { needsPartnershipOnboarding } from "@/lib/community/partnership-preferences";
import { getUserPartnershipPreferences } from "@/lib/community/user-partnership-prefs";
import { isCommunityMemberRole } from "@/lib/auth-roles";
import { MissionHubPartnershipGate } from "@/components/community/mission-hub-partnership-gate";
import { safeMissionHubQuery } from "@/lib/mission-hub/safe-query";

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: MISSION_HUB_PWA.themeColor,
  colorScheme: "light",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    absolute: MISSION_HUB_PWA.shortName,
  },
  description: MISSION_HUB_PWA.description,
  applicationName: MISSION_HUB_PWA.shortName,
  manifest: MISSION_HUB_PWA.manifestPath,
  appleWebApp: {
    capable: true,
    title: MISSION_HUB_PWA.shortName,
    statusBarStyle: "default",
  },
  icons: {
    apple: [{ url: MISSION_HUB_PWA.icons.apple, sizes: "180x180" }],
    icon: MISSION_HUB_PWA.icons.any.map(({ url, sizes, type }) => ({
      url,
      sizes,
      type,
    })),
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": MISSION_HUB_PWA.shortName,
    "apple-mobile-web-app-status-bar-style": "default",
  },
};

/** Mission Hub app shell — no storefront header/footer (see parent layout). */
export default async function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [owner, member, copy, headersList, session, publishedSpaces] = await Promise.all([
    safeMissionHubQuery("layout", "owner", () => getCurrentCommunityOwner(), null),
    safeMissionHubQuery("layout", "member", () => getCurrentCommunityMember(), null),
    safeMissionHubQuery("layout", "site-copy", () => getSiteCopy(), DEFAULT_SITE_COPY),
    headers(),
    safeMissionHubQuery("layout", "auth", () => auth(), null),
    safeMissionHubQuery("layout", "published-spaces", () => listPublishedCommunitySpaces(), []),
  ]);

  const notificationUserId = session?.user?.id ?? null;
  let composerSpaces: Awaited<ReturnType<typeof listComposerSpacesForOwner>> = [];
  if (owner) {
    try {
      composerSpaces = await listComposerSpacesForOwner();
    } catch (e) {
      console.error("[community layout] composer spaces:", e);
    }
  }

  let initialUnreadCount = 0;
  if (notificationUserId) {
    initialUnreadCount = await safeMissionHubQuery(
      "notifications",
      "layout-unread-count",
      () => countUnreadNotifications(notificationUserId),
      0,
    );
  }

  let membersPreview: Awaited<ReturnType<typeof getAdminMembersHubPreview>> | null = null;
  if (owner) {
    try {
      membersPreview = await getAdminMembersHubPreview();
    } catch (e) {
      console.error("[community layout] members preview:", e);
    }
  }

  const pathname = headersList.get("x-pathname") ?? "";
  const isAuthPage =
    pathname === "/community/login" || pathname === "/community/join";
  const isSettingsPage = pathname.startsWith("/community/settings");
  const showBottomNav = !isAuthPage && !isSettingsPage;

  let partnershipPrefs = null;
  let showPartnershipOnboarding = false;
  if (notificationUserId && !isAuthPage) {
    try {
      partnershipPrefs = await getUserPartnershipPreferences(notificationUserId);
      const hubParticipant =
        Boolean(member) || isCommunityMemberRole(session?.user?.role ?? null);
      showPartnershipOnboarding =
        hubParticipant && needsPartnershipOnboarding(partnershipPrefs);
    } catch (e) {
      console.error("[community layout] partnership prefs:", e);
    }
  }

  return (
    <CommunityPublishedSpacesProvider initialSpaces={publishedSpaces}>
      <MissionHubShell
        owner={owner}
        member={member}
        siteName={copy.site.name}
        showBottomNav={showBottomNav}
        showInstallHint={!isAuthPage && !isSettingsPage}
        accountImageUrl={session?.user?.image ?? null}
        notificationUserId={notificationUserId}
        initialUnreadCount={initialUnreadCount}
        composerSpaces={composerSpaces}
        membersPreview={membersPreview}
      >
        <MissionHubPartnershipGate
          needsOnboarding={showPartnershipOnboarding}
          initialPrefs={partnershipPrefs}
        >
          {children}
        </MissionHubPartnershipGate>
      </MissionHubShell>
    </CommunityPublishedSpacesProvider>
  );
}
