import { describe, expect, it } from "vitest";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/community/settings-types";
import {
  categoryFrequency,
  deriveCategoryFrequenciesFromLegacy,
  memberUsesWeeklyDigestCategories,
  wantsImmediateEmailForCategory,
} from "./notification-category-preferences";

describe("notification category preferences", () => {
  it("derives frequencies from legacy boolean prefs", () => {
    expect(
      deriveCategoryFrequenciesFromLegacy({
        ministryUpdates: false,
        newsletters: true,
        weeklyDigest: true,
        prayerResponses: true,
        newPosts: false,
        commentsOnPosts: false,
        repliesToComments: false,
      }),
    ).toEqual({
      ministryUpdates: "never",
      prayerRequests: "immediate",
      praiseReports: "immediate",
      newsletters: "weekly_digest",
      communityActivity: "never",
    });
  });

  it("allows immediate email only when frequency is immediate and email channel is on", () => {
    const prefs = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      email: true,
      categoryFrequencies: {
        ...DEFAULT_NOTIFICATION_PREFERENCES.categoryFrequencies,
        newsletters: "immediate" as const,
      },
    };
    expect(wantsImmediateEmailForCategory(prefs, "newsletters")).toBe(true);
    expect(
      wantsImmediateEmailForCategory(
        {
          ...prefs,
          categoryFrequencies: {
            ...prefs.categoryFrequencies,
            newsletters: "weekly_digest",
          },
        },
        "newsletters",
      ),
    ).toBe(false);
  });

  it("treats never frequency as disabled content", () => {
    const prefs = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      categoryFrequencies: {
        ...DEFAULT_NOTIFICATION_PREFERENCES.categoryFrequencies,
        praiseReports: "never" as const,
      },
    };
    expect(categoryFrequency(prefs, "praiseReports")).toBe("never");
  });

  it("includes legacy weeklyDigest in weekly digest eligibility", () => {
    expect(
      memberUsesWeeklyDigestCategories({
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        weeklyDigest: true,
      }),
    ).toBe(true);
  });
});
