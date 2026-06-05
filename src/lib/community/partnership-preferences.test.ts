import { describe, expect, it } from "vitest";
import {
  DEFAULT_PARTNERSHIP_ONBOARDING_SELECTION,
  applyPartnershipToNotificationPreferences,
  memberMatchesPartnershipSegment,
  mergePartnershipPreferences,
  needsPartnershipOnboarding,
  partnershipPreferencesFromSelection,
} from "./partnership-preferences";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "./settings-types";

describe("partnership preferences", () => {
  it("defaults ministry updates on for new onboarding selection", () => {
    expect(DEFAULT_PARTNERSHIP_ONBOARDING_SELECTION.ministryUpdates).toBe(true);
    expect(DEFAULT_PARTNERSHIP_ONBOARDING_SELECTION.newsletters).toBe(false);
    expect(DEFAULT_PARTNERSHIP_ONBOARDING_SELECTION.prayerTeam).toBe(false);
  });

  it("treats missing engagement prefs as needing onboarding", () => {
    expect(needsPartnershipOnboarding(null)).toBe(true);
    expect(needsPartnershipOnboarding(undefined)).toBe(true);
  });

  it("does not require onboarding after completedAt is set", () => {
    const prefs = partnershipPreferencesFromSelection(
      { ...DEFAULT_PARTNERSHIP_ONBOARDING_SELECTION, newsletters: true },
      true,
    );
    expect(needsPartnershipOnboarding(prefs)).toBe(false);
    expect(mergePartnershipPreferences(prefs)?.newsletters).toBe(true);
    expect(prefs.welcomeIntroCompleted).toBe(false);
  });

  it("syncs ministry updates and newsletters to notification prefs", () => {
    const partnership = partnershipPreferencesFromSelection(
      {
        ...DEFAULT_PARTNERSHIP_ONBOARDING_SELECTION,
        ministryUpdates: false,
        newsletters: true,
        prayerTeam: true,
        urgentPrayerRequests: false,
        advocacyInterest: false,
        financialPartnership: false,
      },
      true,
    );
    const synced = applyPartnershipToNotificationPreferences(
      partnership,
      DEFAULT_NOTIFICATION_PREFERENCES,
    );
    expect(synced.ministryUpdates).toBe(false);
    expect(synced.newsletters).toBe(true);
    expect(synced.prayerResponses).toBe(true);
  });

  it("filters admin segments", () => {
    const row = {
      partnershipCompleted: true,
      ministryUpdates: true,
      newsletters: false,
      prayerTeam: true,
      urgentPrayerRequests: false,
      advocacyInterest: false,
      financialPartnership: false,
    };
    expect(memberMatchesPartnershipSegment(row, "prayerTeam")).toBe(true);
    expect(memberMatchesPartnershipSegment(row, "newsletters")).toBe(false);
    expect(
      memberMatchesPartnershipSegment(
        { ...row, partnershipCompleted: false },
        "onboardingPending",
      ),
    ).toBe(true);
  });
});
