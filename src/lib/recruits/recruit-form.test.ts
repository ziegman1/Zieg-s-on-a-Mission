import { describe, expect, it } from "vitest";
import {
  formatRecruitInputErrors,
  recruitInputSchema,
  recruitMilestoneSchema,
} from "./recruit-form";

describe("recruitInputSchema", () => {
  it("accepts a recruit name", () => {
    const result = recruitInputSchema.safeParse({ name: "Ada Lovelace" });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Ada Lovelace");
  });

  it("trims surrounding whitespace", () => {
    const result = recruitInputSchema.parse({ name: "  Ada Lovelace  " });

    expect(result.name).toBe("Ada Lovelace");
  });

  it("rejects an empty name", () => {
    expect(recruitInputSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("rejects a whitespace-only name", () => {
    expect(recruitInputSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("rejects a name beyond the column limit", () => {
    expect(recruitInputSchema.safeParse({ name: "a".repeat(121) }).success).toBe(false);
  });

  it("accepts a name at exactly the limit", () => {
    expect(recruitInputSchema.safeParse({ name: "a".repeat(120) }).success).toBe(true);
  });

  it("rejects a missing name", () => {
    expect(recruitInputSchema.safeParse({}).success).toBe(false);
  });
});

describe("recruitMilestoneSchema", () => {
  it("accepts both checkboxes in any combination", () => {
    for (const jonathanTrainingComplete of [false, true]) {
      for (const fullyFunded of [false, true]) {
        const result = recruitMilestoneSchema.safeParse({
          jonathanTrainingComplete,
          fullyFunded,
        });
        expect(result.success).toBe(true);
      }
    }
  });

  it("allows Fully Funded without training, leaving Sent to the derived count", () => {
    const result = recruitMilestoneSchema.safeParse({
      jonathanTrainingComplete: false,
      fullyFunded: true,
    });

    expect(result.success).toBe(true);
  });

  it("rejects non-boolean values", () => {
    expect(
      recruitMilestoneSchema.safeParse({
        jonathanTrainingComplete: "yes",
        fullyFunded: false,
      }).success,
    ).toBe(false);
  });
});

describe("formatRecruitInputErrors", () => {
  it("summarizes a field error into a readable line", () => {
    const result = recruitInputSchema.safeParse({ name: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatRecruitInputErrors(result.error)).toContain("Recruit name is required");
    }
  });
});
