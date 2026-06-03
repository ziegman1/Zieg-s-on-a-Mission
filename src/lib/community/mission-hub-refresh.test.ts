import { describe, expect, it } from "vitest";
import {
  missionHubFeedPathFromPathname,
  shouldAllowMissionHubRefresh,
  shouldRouterRefreshAfterSnapshot,
  MISSION_HUB_PTR_TRIGGER_PX,
} from "@/lib/community/mission-hub-refresh";
import { missionHubPollIntervalMs, shouldPollMissionHub } from "@/lib/community/mission-hub-refresh-schedule";
import {
  canStartPullToRefresh,
  pullToRefreshProgress,
  shouldTriggerPullToRefresh,
} from "@/lib/community/mission-hub-pull-to-refresh";

describe("missionHubFeedPathFromPathname", () => {
  it("treats /community as home feed", () => {
    expect(missionHubFeedPathFromPathname("/community")).toEqual({
      isFeedRoute: true,
      spaceSlug: null,
    });
  });

  it("treats space slug routes as feed routes", () => {
    expect(missionHubFeedPathFromPathname("/community/prayer-room")).toEqual({
      isFeedRoute: true,
      spaceSlug: "prayer-room",
    });
  });

  it("excludes settings and auth from feed routes", () => {
    expect(missionHubFeedPathFromPathname("/community/settings")).toEqual({
      isFeedRoute: false,
      spaceSlug: null,
    });
    expect(missionHubFeedPathFromPathname("/community/login")).toEqual({
      isFeedRoute: false,
      spaceSlug: null,
    });
  });
});

describe("shouldAllowMissionHubRefresh", () => {
  it("debounces rapid refreshes", () => {
    const now = 10_000;
    expect(shouldAllowMissionHubRefresh(now - 500, now)).toBe(false);
    expect(shouldAllowMissionHubRefresh(now - 1000, now)).toBe(true);
  });

  it("allows forced refresh inside debounce window", () => {
    expect(shouldAllowMissionHubRefresh(9999, 10_000, true)).toBe(true);
  });
});

describe("shouldRouterRefreshAfterSnapshot", () => {
  it("refreshes RSC only on explicit user actions", () => {
    expect(shouldRouterRefreshAfterSnapshot("pull")).toBe(true);
    expect(shouldRouterRefreshAfterSnapshot("banner")).toBe(true);
    expect(shouldRouterRefreshAfterSnapshot("manual")).toBe(true);
    expect(shouldRouterRefreshAfterSnapshot("focus")).toBe(false);
    expect(shouldRouterRefreshAfterSnapshot("poll")).toBe(false);
    expect(shouldRouterRefreshAfterSnapshot("realtime")).toBe(false);
  });

  it("honors force flag for banner acknowledge", () => {
    expect(shouldRouterRefreshAfterSnapshot("focus", { force: true })).toBe(true);
  });
});

describe("mission hub polling schedule", () => {
  it("polls on visible tab", () => {
    expect(shouldPollMissionHub(true)).toBe(true);
    expect(missionHubPollIntervalMs(true)).toBeGreaterThan(0);
  });

  it("pauses polling when hidden", () => {
    expect(shouldPollMissionHub(false)).toBe(false);
    expect(missionHubPollIntervalMs(false)).toBe(0);
  });
});

describe("pull-to-refresh", () => {
  it("only starts at scroll top", () => {
    expect(canStartPullToRefresh(0)).toBe(true);
    expect(canStartPullToRefresh(8)).toBe(false);
  });

  it("triggers refresh past threshold", () => {
    expect(shouldTriggerPullToRefresh(MISSION_HUB_PTR_TRIGGER_PX - 1)).toBe(false);
    expect(shouldTriggerPullToRefresh(MISSION_HUB_PTR_TRIGGER_PX)).toBe(true);
    expect(pullToRefreshProgress(MISSION_HUB_PTR_TRIGGER_PX / 2)).toBe(0.5);
  });
});
