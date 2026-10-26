import { describe, expect, it } from "vitest";
import { countMinistryOutcomes } from "./ministry-milestones";

describe("countMinistryOutcomes", () => {
  it("does not count a person who was only added", () => {
    expect(
      countMinistryOutcomes([{ mobilized: false, trainedEquipped: false, sent: false }]),
    ).toEqual({ mobilized: 0, trainedEquipped: 0, sent: 0 });
  });

  it("counts each confirmed milestone on its own", () => {
    expect(
      countMinistryOutcomes([
        { mobilized: true, trainedEquipped: false, sent: false },
        { mobilized: false, trainedEquipped: true, sent: false },
        { mobilized: false, trainedEquipped: false, sent: true },
      ]),
    ).toEqual({ mobilized: 1, trainedEquipped: 1, sent: 1 });
  });

  it("allows Sent without Mobilized or Trained & Equipped", () => {
    const counts = countMinistryOutcomes([
      { mobilized: false, trainedEquipped: false, sent: true },
    ]);
    expect(counts.sent).toBe(1);
    expect(counts.sent).toBeGreaterThan(counts.mobilized);
    expect(counts.sent).toBeGreaterThan(counts.trainedEquipped);
  });

  it("counts a person once even when every milestone is confirmed", () => {
    expect(
      countMinistryOutcomes([{ mobilized: true, trainedEquipped: true, sent: true }]),
    ).toEqual({ mobilized: 1, trainedEquipped: 1, sent: 1 });
  });

  it("counts two spouses separately", () => {
    expect(
      countMinistryOutcomes([
        { mobilized: true, trainedEquipped: true, sent: false },
        { mobilized: false, trainedEquipped: false, sent: true },
      ]),
    ).toEqual({ mobilized: 1, trainedEquipped: 1, sent: 1 });
  });
});
