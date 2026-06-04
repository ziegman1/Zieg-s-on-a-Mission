import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  missionHubPathHasWelcomeHero,
  missionHubPostHashFromLocation,
  resolveMissionHubLandingMode,
  shouldAutoScrollToFeed,
  shouldSkipInitialLandingScroll,
  spaceShouldLandAtHero,
} from "@/lib/community/mission-hub-scroll";

describe("spaceShouldLandAtHero", () => {
  it("returns true for Prayer Room and spiritual rooms", () => {
    expect(
      spaceShouldLandAtHero({
        slug: "prayer-and-praise-room",
        spaceType: "prayer_room",
      }),
    ).toBe(true);
    expect(
      spaceShouldLandAtHero({
        slug: "praise-room",
        spaceType: "praise_room",
      }),
    ).toBe(true);
  });

  it("returns true when cover image is set", () => {
    expect(
      spaceShouldLandAtHero({
        slug: "ministry-updates",
        coverImageUrl: "https://example.com/cover.jpg",
      }),
    ).toBe(true);
  });

  it("returns false for standard space without cover", () => {
    expect(
      spaceShouldLandAtHero({
        slug: "ministry-updates",
        spaceType: "updates",
        showWelcomeMessage: true,
        welcomeMessage: "Welcome text only",
      }),
    ).toBe(false);
  });
});

describe("resolveMissionHubLandingMode", () => {
  it("returns latestPost for All Posts when a post exists", () => {
    expect(
      resolveMissionHubLandingMode("/community", { latestPostId: "post-1" }),
    ).toBe("latestPost");
  });

  it("returns none for /community/spaces", () => {
    expect(resolveMissionHubLandingMode("/community/spaces")).toBe("none");
  });

  it("returns hero for Prayer Room", () => {
    expect(
      resolveMissionHubLandingMode("/community/prayer-and-praise-room", {
        space: { slug: "prayer-and-praise-room", spaceType: "prayer_room" },
        latestPostId: "post-1",
      }),
    ).toBe("hero");
  });

  it("returns latestPost for space without hero", () => {
    expect(
      resolveMissionHubLandingMode("/community/ministry-updates", {
        space: { slug: "ministry-updates", spaceType: "updates" },
        latestPostId: "post-9",
      }),
    ).toBe("latestPost");
  });

  it("returns hero for space with cover image", () => {
    expect(
      resolveMissionHubLandingMode("/community/resources", {
        space: {
          slug: "resources",
          coverImageUrl: "https://example.com/hero.png",
        },
        latestPostId: "post-1",
      }),
    ).toBe("hero");
  });
});

describe("shouldSkipInitialLandingScroll", () => {
  it("skips when hash targets a post", () => {
    expect(
      shouldSkipInitialLandingScroll({
        hash: "#post-abc",
        mode: "latestPost",
      }),
    ).toBe(true);
  });

  it("skips when user already scrolled", () => {
    expect(
      shouldSkipInitialLandingScroll({
        userScrolled: true,
        mode: "latestPost",
      }),
    ).toBe(true);
  });

  it("skips when mode is none", () => {
    expect(shouldSkipInitialLandingScroll({ mode: "none" })).toBe(true);
  });

  it("does not skip latestPost landing without hash or user scroll", () => {
    expect(
      shouldSkipInitialLandingScroll({
        mode: "latestPost",
      }),
    ).toBe(false);
  });
});

describe("mission hub scroll policy", () => {
  it("blocks auto-scroll on initial load", () => {
    expect(
      shouldAutoScrollToFeed({
        userInitiated: false,
        pathname: "/community",
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

  it("detects prayer room welcome hero path", () => {
    expect(
      missionHubPathHasWelcomeHero("/community/prayer-and-praise-room"),
    ).toBe(true);
    expect(missionHubPathHasWelcomeHero("/community/ministry-updates")).toBe(false);
  });
});

describe("Mission Hub landing integration sources", () => {
  it("prayer room view uses hero landing scroll", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/community/community-spiritual-space-view.tsx"),
      "utf8",
    );
    expect(source).toContain('mode="hero"');
    expect(source).toContain("onScrollToFeed={scrollToFeed}");
    expect(source.match(/scrollToFeed\(\)/g)?.length ?? 0).toBe(1);
  });

  it("post card only auto-focuses comments when panel is open", () => {
    const card = readFileSync(
      resolve(process.cwd(), "src/components/community/community-post-card.tsx"),
      "utf8",
    );
    expect(card).toContain("commentsOpen ?");
    expect(card).toMatch(/commentsOpen[\s\S]*autoFocusComposer/);
  });

  it("feed wires MissionHubInitialLandingScroll and latest post marker", () => {
    const feed = readFileSync(
      resolve(process.cwd(), "src/components/community/community-post-feed.tsx"),
      "utf8",
    );
    const card = readFileSync(
      resolve(process.cwd(), "src/components/community/community-post-card.tsx"),
      "utf8",
    );
    expect(feed).toContain("MissionHubInitialLandingScroll");
    expect(feed).toContain("isLatestInFeed");
    expect(card).toContain("data-mission-hub-latest-post");
  });

  it("community page resolves latestPost landing", () => {
    const page = readFileSync(
      resolve(process.cwd(), "src/app/(storefront)/community/page.tsx"),
      "utf8",
    );
    expect(page).toContain("resolveMissionHubLandingMode");
    expect(page).toContain('landingRouteKey="/community"');
  });
});
