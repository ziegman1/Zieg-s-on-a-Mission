import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  missionHubPathHasWelcomeHero,
  missionHubPostHashFromLocation,
  shouldAutoScrollToFeed,
} from "@/lib/community/mission-hub-scroll";

describe("mission hub scroll policy", () => {
  it("blocks auto-scroll on initial load", () => {
    expect(
      shouldAutoScrollToFeed({
        userInitiated: false,
        pathname: "/community",
      }),
    ).toBe(false);
    expect(
      shouldAutoScrollToFeed({
        userInitiated: false,
        hasWelcomeHero: true,
        spaceSlug: "prayer-and-praise-room",
      }),
    ).toBe(false);
  });

  it("allows scroll when user initiated", () => {
    expect(
      shouldAutoScrollToFeed({
        userInitiated: true,
        hasWelcomeHero: true,
        spaceSlug: "prayer-and-praise-room",
      }),
    ).toBe(true);
    expect(
      shouldAutoScrollToFeed({
        userInitiated: true,
        pathname: "/community",
      }),
    ).toBe(true);
  });

  it("allows scroll for post hash navigation", () => {
    expect(
      shouldAutoScrollToFeed({
        userInitiated: false,
        hashTargetsPost: true,
      }),
    ).toBe(true);
    expect(missionHubPostHashFromLocation("#post-abc-123")).toBe("abc-123");
  });

  it("detects prayer room welcome hero", () => {
    expect(
      missionHubPathHasWelcomeHero("/community/prayer-and-praise-room"),
    ).toBe(true);
    expect(missionHubPathHasWelcomeHero("/community/ministry-updates")).toBe(false);
  });
});

describe("Mission Hub initial scroll sources", () => {
  it("prayer room view does not auto-scroll on load", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/community/community-spiritual-space-view.tsx"),
      "utf8",
    );
    expect(source.match(/scrollToFeed\(\)/g)?.length ?? 0).toBe(1);
    expect(source).toContain("onScrollToFeed={scrollToFeed}");
    expect(source).toContain("handleShared");
  });

  it("post card only auto-focuses comments when panel is open", () => {
    const card = readFileSync(
      resolve(process.cwd(), "src/components/community/community-post-card.tsx"),
      "utf8",
    );
    expect(card).toContain("commentsOpen ?");
    expect(card).toMatch(/commentsOpen[\s\S]*autoFocusComposer/);
    expect(card).not.toMatch(/autoFocusComposer\s*\n\s*autoFocusKey=\{composerFocusKey\}[\s\S]*commentsOpen/);
  });

  it("registers initial scroll guard in mission hub shell", () => {
    const shell = readFileSync(
      resolve(process.cwd(), "src/components/community/mission-hub-shell.tsx"),
      "utf8",
    );
    expect(shell).toContain("MissionHubInitialScrollGuard");
  });
});
