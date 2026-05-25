"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchMissionHubRefreshSnapshotAction } from "@/app/(storefront)/community/hub-refresh-actions";
import {
  dispatchMissionHubNotificationsSync,
  dispatchMissionHubRefresh,
  missionHubFeedPathFromPathname,
  shouldAllowMissionHubRefresh,
  type MissionHubRefreshSource,
} from "@/lib/community/mission-hub-refresh";
import {
  missionHubPollIntervalMs,
  shouldPollMissionHub,
} from "@/lib/community/mission-hub-refresh-schedule";

export type MissionHubRefreshContextValue = {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  feedHasUpdates: boolean;
  acknowledgeFeedUpdates: () => void;
  refresh: (source: MissionHubRefreshSource, opts?: { force?: boolean }) => Promise<void>;
  isRefreshing: boolean;
};

const MissionHubRefreshContext = createContext<MissionHubRefreshContextValue | null>(
  null,
);

export function useMissionHubRefresh(): MissionHubRefreshContextValue {
  const ctx = useContext(MissionHubRefreshContext);
  if (!ctx) {
    throw new Error("useMissionHubRefresh must be used within MissionHubRefreshProvider");
  }
  return ctx;
}

export function useMissionHubRefreshOptional(): MissionHubRefreshContextValue | null {
  return useContext(MissionHubRefreshContext);
}

export function MissionHubRefreshProvider({
  children,
  notificationUserId = null,
  initialUnreadCount = 0,
}: {
  children: ReactNode;
  notificationUserId?: string | null;
  initialUnreadCount?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isFeedRoute, spaceSlug } = missionHubFeedPathFromPathname(pathname);

  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [feedHasUpdates, setFeedHasUpdates] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const baselineFeedVersion = useRef<string | null>(null);
  const baselineNotificationAt = useRef<string | null>(null);
  const lastRefreshAt = useRef(0);
  const refreshInFlight = useRef(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setUnreadCount(initialUnreadCount);
  }, [initialUnreadCount]);

  const applySnapshot = useCallback(
    (
      snapshot: {
        feedVersion: string;
        unreadCount: number;
        latestNotificationAt: string | null;
      },
      opts: { compareFeed: boolean; source: MissionHubRefreshSource },
    ) => {
      if (notificationUserId) {
        setUnreadCount(snapshot.unreadCount);
        dispatchMissionHubNotificationsSync(snapshot.unreadCount);
      }

      if (opts.compareFeed && isFeedRoute && baselineFeedVersion.current) {
        const feedChanged = snapshot.feedVersion !== baselineFeedVersion.current;
        const notifChanged =
          snapshot.latestNotificationAt !== baselineNotificationAt.current;
        if (feedChanged || notifChanged) {
          setFeedHasUpdates(true);
        }
      }

      baselineFeedVersion.current = snapshot.feedVersion;
      baselineNotificationAt.current = snapshot.latestNotificationAt;
    },
    [isFeedRoute, notificationUserId],
  );

  const loadSnapshot = useCallback(async () => {
    const slug = isFeedRoute ? spaceSlug : null;
    return fetchMissionHubRefreshSnapshotAction(slug);
  }, [isFeedRoute, spaceSlug]);

  const refresh = useCallback(
    async (source: MissionHubRefreshSource, opts?: { force?: boolean }) => {
      const now = Date.now();
      if (refreshInFlight.current) return;
      if (!shouldAllowMissionHubRefresh(lastRefreshAt.current, now, opts?.force)) return;

      refreshInFlight.current = true;
      setIsRefreshing(true);
      lastRefreshAt.current = now;

      try {
        const result = await loadSnapshot();
        if (result.ok) {
          applySnapshot(result.snapshot, {
            compareFeed: source === "poll",
            source,
          });
        }

        if (isFeedRoute || source === "pull" || source === "focus" || opts?.force) {
          router.refresh();
        }

        dispatchMissionHubRefresh({ source, force: opts?.force });
        if (source !== "poll") setFeedHasUpdates(false);
      } finally {
        refreshInFlight.current = false;
        setIsRefreshing(false);
      }
    },
    [applySnapshot, isFeedRoute, loadSnapshot, router],
  );

  const acknowledgeFeedUpdates = useCallback(() => {
    setFeedHasUpdates(false);
    void refresh("banner", { force: true });
  }, [refresh]);

  const bootstrap = useCallback(async () => {
    setFeedHasUpdates(false);
    const result = await loadSnapshot();
    if (result.ok) {
      applySnapshot(result.snapshot, { compareFeed: false, source: "manual" });
    }
  }, [applySnapshot, loadSnapshot]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap, pathname]);

  useEffect(() => {
    function clearPoll() {
      if (pollTimer.current) {
        clearInterval(pollTimer.current);
        pollTimer.current = null;
      }
    }

    function startPoll() {
      clearPoll();
      const visible = document.visibilityState === "visible";
      if (!shouldPollMissionHub(visible)) return;
      const ms = missionHubPollIntervalMs(visible);
      pollTimer.current = setInterval(() => {
        if (document.visibilityState !== "visible") return;
        void refresh("poll");
      }, ms);
    }

    startPoll();

    function onVisibility() {
      startPoll();
      if (document.visibilityState === "visible") {
        void refresh("focus");
      }
    }

    function onWindowFocus() {
      void refresh("focus");
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onWindowFocus);

    return () => {
      clearPoll();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onWindowFocus);
    };
  }, [refresh, pathname]);

  const value = useMemo(
    () => ({
      unreadCount,
      setUnreadCount,
      feedHasUpdates,
      acknowledgeFeedUpdates,
      refresh,
      isRefreshing,
    }),
    [unreadCount, feedHasUpdates, acknowledgeFeedUpdates, refresh, isRefreshing],
  );

  return (
    <MissionHubRefreshContext.Provider value={value}>
      {children}
    </MissionHubRefreshContext.Provider>
  );
}
