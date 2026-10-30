import { describe, expect, it } from "vitest";
import { sentGoalPercent } from "@/lib/recruits/recruit-milestones";
import {
  combineMinistryOutcomes,
  countMinistryOutcomes,
  countNationalPartnerInitiativeOutcomes,
  publicProgressCounts,
} from "./ministry-milestones";

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

describe("national partner initiative totals", () => {
  it("adds one initiative's completed count to every milestone", () => {
    expect(countNationalPartnerInitiativeOutcomes([{ completedCount: 40 }])).toEqual({
      mobilized: 40,
      trainedEquipped: 40,
      sent: 40,
    });
  });

  it("adds two initiatives without counting either one twice", () => {
    expect(
      countNationalPartnerInitiativeOutcomes([{ completedCount: 40 }, { completedCount: 15 }]),
    ).toEqual({ mobilized: 55, trainedEquipped: 55, sent: 55 });
  });

  it("uses the edited count rather than adding the old and new counts", () => {
    const before = countNationalPartnerInitiativeOutcomes([{ completedCount: 40 }]);
    const after = countNationalPartnerInitiativeOutcomes([{ completedCount: 25 }]);
    expect(before.sent).toBe(40);
    expect(after).toEqual({ mobilized: 25, trainedEquipped: 25, sent: 25 });
  });

  it("drops a removed initiative from the totals", () => {
    const remaining = countNationalPartnerInitiativeOutcomes([{ completedCount: 15 }]);
    expect(remaining).toEqual({ mobilized: 15, trainedEquipped: 15, sent: 15 });
  });

  it("rejects a zero or negative completed count", () => {
    expect(() => countNationalPartnerInitiativeOutcomes([{ completedCount: 0 }])).toThrow(
      /positive/,
    );
    expect(() => countNationalPartnerInitiativeOutcomes([{ completedCount: -4 }])).toThrow(
      /positive/,
    );
  });

  it("keeps individual milestone counts and adds initiative participants beside them", () => {
    const individuals = { mobilized: 8, trainedEquipped: 6, sent: 6 };
    const snapshot = { ...individuals };
    const totals = combineMinistryOutcomes(
      individuals,
      countNationalPartnerInitiativeOutcomes([{ completedCount: 40 }]),
    );
    expect(individuals).toEqual(snapshot);
    expect(totals.individuals).toEqual(snapshot);
    expect(totals.nationalPartnerInitiatives).toEqual({
      mobilized: 40,
      trainedEquipped: 40,
      sent: 40,
    });
    expect(totals.unified).toEqual({ mobilized: 48, trainedEquipped: 46, sent: 46 });
  });

  it("maps unified totals to the homepage without clamping or hardcoded counts", () => {
    const counts = publicProgressCounts(
      combineMinistryOutcomes(
        { mobilized: 39, trainedEquipped: 22, sent: 12 },
        countNationalPartnerInitiativeOutcomes([{ completedCount: 60 }]),
      ),
    );
    expect(counts).toEqual({ mobilized: 99, trained: 82, sent: 72 });
    expect(sentGoalPercent(counts.sent)).toBe(24);
    expect(300 - counts.sent).toBe(228);

    const unclamped = publicProgressCounts(
      combineMinistryOutcomes(
        { mobilized: 0, trainedEquipped: 0, sent: 1 },
        { mobilized: 0, trainedEquipped: 0, sent: 0 },
      ),
    );
    expect(unclamped).toEqual({ mobilized: 0, trained: 0, sent: 1 });
  });
});
