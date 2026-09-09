import { describe, expect, it } from "vitest";
import {
  clampRecruitCounts,
  countRecruitMilestones,
  isSent,
  isTrained,
  RECRUIT_SENT_GOAL,
  sentGoalPercent,
  type RecruitMilestoneInput,
} from "./recruit-milestones";

function recruit(overrides: Partial<RecruitMilestoneInput> = {}): RecruitMilestoneInput {
  return { jonathanTrainingComplete: false, fullyFunded: false, ...overrides };
}

const BOOLEANS = [false, true] as const;

const NEW_RECRUIT = recruit();
const TRAINED = recruit({ jonathanTrainingComplete: true });
const FUNDED_ONLY = recruit({ fullyFunded: true });
const SENT = recruit({ jonathanTrainingComplete: true, fullyFunded: true });

describe("isTrained", () => {
  it("is true once Jonathan Training is complete", () => {
    expect(isTrained(TRAINED)).toBe(true);
  });

  it("is false for a brand new recruit", () => {
    expect(isTrained(NEW_RECRUIT)).toBe(false);
  });

  it("is not implied by funding alone", () => {
    expect(isTrained(FUNDED_ONLY)).toBe(false);
  });
});

describe("isSent", () => {
  it("requires both training and full funding", () => {
    expect(isSent(SENT)).toBe(true);
  });

  it("does not count a fully funded recruit whose training is incomplete", () => {
    // The admin UI leaves Fully Funded independent, so this combination is reachable.
    expect(isSent(FUNDED_ONLY)).toBe(false);
  });

  it("does not count a trained recruit who is not yet funded", () => {
    expect(isSent(TRAINED)).toBe(false);
  });

  it("does not count a brand new recruit", () => {
    expect(isSent(NEW_RECRUIT)).toBe(false);
  });
});

describe("cumulative progression", () => {
  it("holds Sent <= Trained for every checkbox combination", () => {
    for (const jonathanTrainingComplete of BOOLEANS) {
      for (const fullyFunded of BOOLEANS) {
        const record = { jonathanTrainingComplete, fullyFunded };
        expect(Number(isSent(record))).toBeLessThanOrEqual(Number(isTrained(record)));
      }
    }
  });
});

describe("countRecruitMilestones", () => {
  it("counts every record as Mobilized regardless of milestones", () => {
    const counts = countRecruitMilestones([NEW_RECRUIT, TRAINED, FUNDED_ONLY, SENT]);
    expect(counts.mobilized).toBe(4);
  });

  it("counts trained and sent independently of each other", () => {
    const counts = countRecruitMilestones([NEW_RECRUIT, TRAINED, FUNDED_ONLY, SENT]);

    expect(counts).toEqual({ mobilized: 4, trained: 2, sent: 1 });
  });

  it("returns zeroes for an empty roster", () => {
    expect(countRecruitMilestones([])).toEqual({ mobilized: 0, trained: 0, sent: 0 });
  });

  it("treats a record with no name as one person", () => {
    expect(countRecruitMilestones([NEW_RECRUIT])).toEqual({
      mobilized: 1,
      trained: 0,
      sent: 0,
    });
  });

  it("counts a named couple as two people at every milestone reached", () => {
    const counts = countRecruitMilestones([
      { ...SENT, name: "Jeremy and Lindsay Ziegenhorn" },
      { ...TRAINED, name: "Ada Lovelace" },
    ]);

    expect(counts).toEqual({ mobilized: 3, trained: 3, sent: 2 });
  });

  it("does not inflate a name that merely contains the letters and", () => {
    const counts = countRecruitMilestones([{ ...SENT, name: "Alexander Anderson" }]);

    expect(counts).toEqual({ mobilized: 1, trained: 1, sent: 1 });
  });

  it("excludes a funded-but-untrained recruit from Sent", () => {
    const counts = countRecruitMilestones([FUNDED_ONLY, FUNDED_ONLY]);

    expect(counts).toEqual({ mobilized: 2, trained: 0, sent: 0 });
  });

  it("keeps Sent <= Trained <= Mobilized across a mixed roster", () => {
    const counts = countRecruitMilestones([
      NEW_RECRUIT,
      TRAINED,
      TRAINED,
      FUNDED_ONLY,
      SENT,
      SENT,
    ]);

    expect(counts.sent).toBeLessThanOrEqual(counts.trained);
    expect(counts.trained).toBeLessThanOrEqual(counts.mobilized);
    expect(counts).toEqual({ mobilized: 6, trained: 4, sent: 2 });
  });
});

describe("clampRecruitCounts", () => {
  it("passes through a consistent set of counts unchanged", () => {
    expect(clampRecruitCounts({ mobilized: 10, trained: 6, sent: 3 })).toEqual({
      mobilized: 10,
      trained: 6,
      sent: 3,
    });
  });

  it("caps trained at mobilized and sent at trained", () => {
    expect(clampRecruitCounts({ mobilized: 5, trained: 9, sent: 7 })).toEqual({
      mobilized: 5,
      trained: 5,
      sent: 5,
    });
  });

  it("clamps negatives to zero", () => {
    expect(clampRecruitCounts({ mobilized: -4, trained: -2, sent: -1 })).toEqual({
      mobilized: 0,
      trained: 0,
      sent: 0,
    });
  });

  it("truncates fractional values to integers", () => {
    expect(clampRecruitCounts({ mobilized: 10.9, trained: 4.7, sent: 2.2 })).toEqual({
      mobilized: 10,
      trained: 4,
      sent: 2,
    });
  });
});

describe("sentGoalPercent", () => {
  it("reports zero progress with no one sent", () => {
    expect(sentGoalPercent(0)).toBe(0);
  });

  it("uses 300 as the default goal", () => {
    expect(RECRUIT_SENT_GOAL).toBe(300);
    expect(sentGoalPercent(150)).toBe(50);
    expect(sentGoalPercent(3)).toBe(1);
  });

  it("caps at 100 percent once the goal is exceeded", () => {
    expect(sentGoalPercent(450)).toBe(100);
  });

  it("never returns a negative percentage", () => {
    expect(sentGoalPercent(-5)).toBe(0);
  });
});
