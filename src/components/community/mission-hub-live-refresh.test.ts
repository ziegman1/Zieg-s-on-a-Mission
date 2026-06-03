import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

describe("Mission Hub live refresh integration", () => {
  it("wraps main content with pull-to-refresh and refresh provider", () => {
    const shell = readFileSync(
      resolve(process.cwd(), "src/components/community/mission-hub-shell.tsx"),
      "utf8",
    );
    expect(shell).toContain("MissionHubRefreshRoot");
    expect(shell).toContain("MissionHubPullToRefreshMain");
    expect(shell).toContain("mission-hub-scroll");

    const layer = readFileSync(
      resolve(process.cwd(), "src/components/community/mission-hub-live-layer.tsx"),
      "utf8",
    );
    expect(layer).toContain("MissionHubRefreshProvider");
    expect(layer).toContain("MissionHubPullToRefreshMain");
    expect(layer).toContain("MissionHubNewPostsBanner");
    expect(shell).toContain("CommunityTopbar");
  });

  it("pull-to-refresh triggers hub refresh on release", () => {
    const ptr = readFileSync(
      resolve(process.cwd(), "src/components/community/mission-hub-pull-to-refresh.tsx"),
      "utf8",
    );
    expect(ptr).toContain('refresh("pull"');
    expect(ptr).toContain("shouldTriggerPullToRefresh");
  });

  it("refresh provider polls only when document is visible", () => {
    const provider = readFileSync(
      resolve(process.cwd(), "src/components/community/mission-hub-refresh-context.tsx"),
      "utf8",
    );
    expect(provider).toContain("visibilityState");
    expect(provider).toContain('refresh("focus")');
    expect(provider).toContain("shouldPollMissionHub");
    expect(provider).toContain('refresh("poll")');
    expect(provider).toContain("spacesVersion");
    expect(provider).toContain("shouldRouterRefreshAfterSnapshot");
    expect(provider).not.toContain("isCommunityHubRoute || source === \"pull\"");
  });

  it("notification bell syncs unread count from hub refresh", () => {
    const bell = readFileSync(
      resolve(process.cwd(), "src/components/community/community-notifications-bell.tsx"),
      "utf8",
    );
    expect(bell).toContain("useMissionHubRefreshOptional");
    expect(bell).toContain("MISSION_HUB_NOTIFICATIONS_SYNC_EVENT");
    expect(bell).toContain("MISSION_HUB_REFRESH_EVENT");
    expect(bell).toContain("displayUnreadCount");
    expect(bell).toContain("visibilityState");
  });

  it("comments reload on mission hub refresh event", () => {
    const comments = readFileSync(
      resolve(process.cwd(), "src/components/community/community-comments.tsx"),
      "utf8",
    );
    expect(comments).toContain("MISSION_HUB_REFRESH_EVENT");
    expect(comments).toContain("loadPostCommentsAction");
  });
});
