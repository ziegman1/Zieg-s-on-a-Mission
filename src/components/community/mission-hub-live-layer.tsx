"use client";

import type { ReactNode } from "react";
import { MissionHubNewPostsBanner } from "./mission-hub-new-posts-banner";
import { MissionHubPullToRefresh } from "./mission-hub-pull-to-refresh";
import { MissionHubRealtimeBridge } from "./mission-hub-realtime-bridge";
import { MissionHubRefreshProvider } from "./mission-hub-refresh-context";

/**
 * Client live-update layer: polling, focus refresh, notification sync, realtime prep.
 */
export function MissionHubRefreshRoot({
  children,
  notificationUserId = null,
  initialUnreadCount = 0,
}: {
  children: ReactNode;
  notificationUserId?: string | null;
  initialUnreadCount?: number;
}) {
  return (
    <MissionHubRefreshProvider
      notificationUserId={notificationUserId}
      initialUnreadCount={initialUnreadCount}
    >
      <MissionHubRealtimeBridge notificationUserId={notificationUserId} />
      <MissionHubNewPostsBanner />
      {children}
    </MissionHubRefreshProvider>
  );
}

/** Pull-to-refresh wrapper for scrollable feed main content. */
export function MissionHubPullToRefreshMain({ children }: { children: ReactNode }) {
  return <MissionHubPullToRefresh>{children}</MissionHubPullToRefresh>;
}
