import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { MissionHubShell } from "@/components/community/mission-hub-shell";
import { getCurrentCommunityMember } from "@/lib/community/members";
import { countUnreadNotifications } from "@/lib/community/notifications";
import { listComposerSpacesForOwner } from "@/lib/community/composer-spaces";
import { getCurrentCommunityOwner } from "@/lib/community/owner";
import { MISSION_HUB_PWA } from "@/lib/community/mission-hub-pwa";
import { getSiteCopy } from "@/lib/site-copy";

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
  const [owner, member, copy, headersList, session] = await Promise.all([
    getCurrentCommunityOwner(),
    getCurrentCommunityMember(),
    getSiteCopy(),
    headers(),
    auth(),
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
    try {
      initialUnreadCount = await countUnreadNotifications(notificationUserId);
    } catch {
      initialUnreadCount = 0;
    }
  }

  const pathname = headersList.get("x-pathname") ?? "";
  const isAuthPage =
    pathname === "/community/login" || pathname === "/community/join";
  const isSettingsPage = pathname.startsWith("/community/settings");
  const showBottomNav = !isAuthPage && !isSettingsPage;

  return (
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
    >
      {children}
    </MissionHubShell>
  );
}
