import { describe, expect, it } from "vitest";
import { ministryPersonMatchesQuery } from "./ministry-labels";
import { ministryActivitySchema, ministryMilestoneSchema, ministryPersonSchema } from "./ministry-form";

describe("ministryPersonSchema", () => {
  it("allows a person with no pathway", () => {
    const result = ministryPersonSchema.safeParse({
      displayName: "Ada Lovelace",
      pathway: "",
      notes: "",
      householdWithPersonId: "",
      legacyRecruitId: "",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.pathway).toBeNull();
  });

  it("rejects an empty name", () => {
    expect(
      ministryPersonSchema.safeParse({
        displayName: "  ",
        pathway: "",
        notes: "",
        householdWithPersonId: "",
        legacyRecruitId: "",
      }).success,
    ).toBe(false);
  });
});

describe("ministryMilestoneSchema", () => {
  const base = {
    mobilized: false,
    mobilizedOn: "",
    trainedEquipped: false,
    trainedEquippedOn: "",
    sent: false,
    sentOn: "",
    sentDesignation: "",
    sentVerifiedBy: "",
    sentVerificationNote: "",
  };

  it("records a milestone without a date", () => {
    const result = ministryMilestoneSchema.safeParse({ ...base, mobilized: true });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.mobilizedOn).toBeNull();
  });

  it("rejects Sent without a designation", () => {
    const result = ministryMilestoneSchema.safeParse({ ...base, sent: true });
    expect(result.success).toBe(false);
  });

  it("accepts Sent with a designation and no date", () => {
    const result = ministryMilestoneSchema.safeParse({
      ...base,
      sent: true,
      sentDesignation: "D_COURSE",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sentOn).toBeNull();
      expect(result.data.mobilized).toBe(false);
      expect(result.data.trainedEquipped).toBe(false);
    }
  });
});

describe("ministryActivitySchema", () => {
  it("accepts Jonathan Training with a venue and no date", () => {
    const result = ministryActivitySchema.safeParse({
      activityType: "JONATHAN_TRAINING",
      status: "COMPLETED",
      activityOn: "",
      location: "Emerald Hills",
      notes: "",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.activityOn).toBeNull();
  });

  it("matches a person by name, pathway, or activity and ignores a blank query", () => {
    const person = {
      displayName: "Ada Lovelace",
      pathway: "NATIONAL_PARTNER" as const,
      notes: "medical cohort",
      activities: [{ activityType: "JONATHAN_TRAINING" as const, location: "Emerald Hills" }],
    };
    expect(ministryPersonMatchesQuery(person, "  ")).toBe(true);
    expect(ministryPersonMatchesQuery(person, "ada")).toBe(true);
    expect(ministryPersonMatchesQuery(person, "national")).toBe(true);
    expect(ministryPersonMatchesQuery(person, "emerald")).toBe(true);
    expect(ministryPersonMatchesQuery(person, "zume")).toBe(false);
  });

  it("does not offer a separate DMM program", () => {
    expect(ministryActivitySchema.safeParse({
      activityType: "DMM",
      status: "COMPLETED",
      activityOn: "",
      location: "",
      notes: "",
    }).success).toBe(false);
  });
});
