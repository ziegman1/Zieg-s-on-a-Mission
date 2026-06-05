import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";
import {
  buildWelcomeIntroRedirectUrl,
  DEFAULT_WELCOME_POST_PATH,
  isDefaultMissionHubAuthCallback,
  normalizeWelcomePostPath,
  resolveWelcomePostPath,
  shouldAutoOpenWelcomeComments,
  shouldRedirectToWelcomeIntro,
  stripWelcomeIntroOpenCommentsFromUrl,
} from "@/lib/community/welcome-intro";
import { mergePartnershipPreferences } from "@/lib/community/partnership-preferences";

describe("welcome intro", () => {
  it("defaults welcomeIntroCompleted to false in merge", () => {
    expect(mergePartnershipPreferences(null)).toBeNull();
    expect(
      mergePartnershipPreferences({ onboardingCompletedAt: "2026-01-01T00:00:00.000Z" })
        ?.welcomeIntroCompleted,
    ).toBe(false);
    expect(
      mergePartnershipPreferences({ welcomeIntroCompleted: true })?.welcomeIntroCompleted,
    ).toBe(true);
  });

  it("redirects new members with default callback after first onboarding save", () => {
    expect(
      shouldRedirectToWelcomeIntro({
        welcomeIntroCompleted: false,
        wasOnboardingPending: true,
        authCallbackUrl: "/community",
      }),
    ).toBe(true);
  });

  it("does not redirect returning members who completed welcome intro", () => {
    expect(
      shouldRedirectToWelcomeIntro({
        welcomeIntroCompleted: true,
        wasOnboardingPending: true,
        authCallbackUrl: "/community",
      }),
    ).toBe(false);
  });

  it("does not redirect when onboarding was already complete (settings re-save)", () => {
    expect(
      shouldRedirectToWelcomeIntro({
        welcomeIntroCompleted: false,
        wasOnboardingPending: false,
        authCallbackUrl: "/community",
      }),
    ).toBe(false);
  });

  it("skips redirect when auth callback was not recorded", () => {
    expect(
      shouldRedirectToWelcomeIntro({
        welcomeIntroCompleted: false,
        wasOnboardingPending: true,
        authCallbackUrl: null,
      }),
    ).toBe(false);
  });

  it("skips redirect for invite callback URLs", () => {
    expect(isDefaultMissionHubAuthCallback("/community/prayer-and-praise-room")).toBe(false);
    expect(
      shouldRedirectToWelcomeIntro({
        welcomeIntroCompleted: false,
        wasOnboardingPending: true,
        authCallbackUrl: "/community/prayer-and-praise-room",
      }),
    ).toBe(false);
  });

  it("builds welcome redirect with openComments query before hash", () => {
    expect(buildWelcomeIntroRedirectUrl("/community/welcome#post-abc123")).toBe(
      "/community/welcome?openComments=1#post-abc123",
    );
    expect(buildWelcomeIntroRedirectUrl("/community/start-here")).toBe(
      "/community/start-here?openComments=1",
    );
  });

  it("resolves configured welcome path with fallback", () => {
    expect(resolveWelcomePostPath(null)).toBe(DEFAULT_WELCOME_POST_PATH);
    expect(resolveWelcomePostPath("/community/welcome#post-x")).toBe(
      "/community/welcome#post-x",
    );
    expect(normalizeWelcomePostPath("https://evil.com/phish")).toBeNull();
  });

  it("auto-opens comments when openComments=1 and hash matches post", () => {
    expect(
      shouldAutoOpenWelcomeComments({
        postId: "abc123",
        search: "?openComments=1",
        hash: "#post-abc123",
      }),
    ).toBe(true);
    expect(
      shouldAutoOpenWelcomeComments({
        postId: "other",
        search: "?openComments=1",
        hash: "#post-abc123",
      }),
    ).toBe(false);
    expect(
      shouldAutoOpenWelcomeComments({
        postId: "abc123",
        search: "",
        hash: "#post-abc123",
      }),
    ).toBe(false);
  });

  it("strips openComments from URL after opening", () => {
    expect(
      stripWelcomeIntroOpenCommentsFromUrl(
        "/community/welcome?openComments=1&foo=1#post-abc",
      ),
    ).toBe("/community/welcome?foo=1#post-abc");
  });
});

describe("welcome intro integration wiring", () => {
  it("partnership action returns redirectTo", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/(storefront)/community/partnership-actions.ts"),
      "utf8",
    );
    expect(source).toContain("redirectTo");
    expect(source).toContain("shouldRedirectToWelcomeIntro");
  });

  it("onboarding reads auth callback and navigates", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/community/mission-hub-partnership-onboarding.tsx"),
      "utf8",
    );
    expect(source).toContain("readMissionHubAuthCallback");
    expect(source).toContain("router.push");
  });

  it("post card auto-opens welcome comments from URL", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/community/community-post-card.tsx"),
      "utf8",
    );
    expect(source).toContain("shouldAutoOpenWelcomeComments");
    expect(source).toContain("stripWelcomeIntroOpenCommentsFromUrl");
  });
});
