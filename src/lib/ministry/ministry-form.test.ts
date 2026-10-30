import { describe, expect, it } from "vitest";
import { ministryPersonMatchesQuery } from "./ministry-labels";
import {
  activityDraftStarted,
  ministryActivitySchema,
  ministryMilestoneSchema,
  ministryPersonSchema,
  planActivityChanges,
} from "./ministry-form";

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

  const blank = {
    activityType: "JONATHAN_TRAINING",
    status: "PARTICIPATED",
    activityOn: "",
    location: "",
    notes: "",
  };

  it("leaves an untouched activity form out of the save", () => {
    expect(activityDraftStarted(blank, blank)).toBe(false);
    const plan = planActivityChanges({ create: null, update: null, deleteIds: [] });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.create).toBeNull();
    expect(plan.update).toBeNull();
  });

  it("includes one valid activity and names the invalid field", () => {
    const started = { ...blank, location: "Emerald Hills" };
    const plan = planActivityChanges({ create: started, update: null, deleteIds: [] });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.create).toEqual(started);

    const invalid = planActivityChanges({
      create: { ...blank, activityOn: "not-a-date", location: "Hall" },
      update: null,
      deleteIds: [],
    });
    expect(invalid.ok).toBe(false);
    if (invalid.ok) return;
    expect(invalid.error).toContain("Date, if known");
  });

  it("does not plan a second copy when the same new activity is described once", () => {
    const started = { ...blank, status: "COMPLETED", location: "Emerald Hills" };
    const plan = planActivityChanges({ create: started, update: null, deleteIds: [] });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.create).toEqual(started);
    expect(Array.isArray(plan.create)).toBe(false);
  });

  it("accepts Launch and every existing program without changing their identifiers", () => {
    const programs = [
      "JONATHAN_TRAINING",
      "MEDICAL_TRAINING",
      "SUPPORT_RAISING_COACHING",
      "D_COURSE",
      "ZUME",
      "FOUR_FIELDS_ONLINE",
      "FIDELIS",
      "LAUNCH",
      "OTHER",
    ] as const;
    for (const activityType of programs) {
      const parsed = ministryActivitySchema.safeParse({
        activityType,
        status: "PARTICIPATED",
        activityOn: "2026-04-01",
        location: "Emerald Hills",
        notes: "unchanged notes",
      });
      expect(parsed.success).toBe(true);
      if (!parsed.success) return;
      expect(parsed.data.activityType).toBe(activityType);
      expect(parsed.data.status).toBe("PARTICIPATED");
      expect(parsed.data.activityOn).toBe("2026-04-01");
      expect(parsed.data.location).toBe("Emerald Hills");
      expect(parsed.data.notes).toBe("unchanged notes");
    }
    expect(ministryPersonMatchesQuery(
      {
        displayName: "Ada",
        pathway: "NATIONAL_PARTNER",
        notes: "",
        activities: [{ activityType: "LAUNCH", location: "" }],
      },
      "launch",
    )).toBe(true);
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
