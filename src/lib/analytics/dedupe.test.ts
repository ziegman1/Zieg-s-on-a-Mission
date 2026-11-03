import { describe, expect, it } from "vitest";
import {
  isDuplicatePageView,
  resetLegacyPageViewDedupeForTests,
  shouldRecordLegacyPageView,
} from "./dedupe";

describe("page view dedupe", () => {
  it("dedupes same session+path inside the window (Strict Mode / double flush)", () => {
    const sessionId = "550e8400-e29b-41d4-a716-446655440000";
    expect(
      isDuplicatePageView({
        sessionId,
        path: "/our-mission",
        previous: { sessionId, path: "/our-mission", at: 1_000 },
        now: 1_500,
      }),
    ).toBe(true);
    expect(
      isDuplicatePageView({
        sessionId,
        path: "/our-mission",
        previous: { sessionId, path: "/our-mission", at: 1_000 },
        now: 4_000,
      }),
    ).toBe(false);
    expect(
      isDuplicatePageView({
        sessionId,
        path: "/partner",
        previous: { sessionId, path: "/our-mission", at: 1_000 },
        now: 1_500,
      }),
    ).toBe(false);
  });

  it("dedupes legacy no-session page views by visitor+path", () => {
    resetLegacyPageViewDedupeForTests();
    expect(shouldRecordLegacyPageView({ visitorKey: "abc", path: "/", now: 1000 })).toBe(true);
    expect(shouldRecordLegacyPageView({ visitorKey: "abc", path: "/", now: 1500 })).toBe(false);
    expect(shouldRecordLegacyPageView({ visitorKey: "abc", path: "/", now: 4000 })).toBe(true);
  });
});
