import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: { recruitRecord: { findMany: vi.fn() } },
}));

import { prisma } from "@/lib/db";
import { getRecruitCounts } from "./recruits-db";
import { RECRUIT_SENT_GOAL, sentGoalPercent } from "./recruit-milestones";

const findMany = vi.mocked(prisma.recruitRecord.findMany);

type Row = { name: string; jonathanTrainingComplete: boolean; fullyFunded: boolean };

function mockRoster(rows: Row[]) {
  // @ts-expect-error the selected subset is all getRecruitCounts reads
  findMany.mockResolvedValue(rows);
}

function person(
  name: string,
  jonathanTrainingComplete = false,
  fullyFunded = false,
): Row {
  return { name, jonathanTrainingComplete, fullyFunded };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("query shape", () => {
  it("selects only the fields needed to count, never ids or timestamps", async () => {
    mockRoster([]);
    await getRecruitCounts();

    expect(findMany).toHaveBeenCalledWith({
      select: { name: true, jonathanTrainingComplete: true, fullyFunded: true },
    });
  });

  it("returns aggregate integers only — no names leak out", async () => {
    mockRoster([person("Ada Lovelace", true, true)]);
    const result = await getRecruitCounts();

    expect(Object.keys(result).sort()).toEqual(["mobilized", "sent", "trained"]);
    for (const value of Object.values(result)) {
      expect(Number.isInteger(value)).toBe(true);
    }
    expect(JSON.stringify(result)).not.toContain("Ada");
  });
});

describe("milestone counts", () => {
  it("counts Mobilized as everyone on the roster", async () => {
    mockRoster([person("Ada"), person("Grace"), person("Alan")]);

    await expect(getRecruitCounts()).resolves.toEqual({
      mobilized: 3,
      trained: 0,
      sent: 0,
    });
  });

  it("counts Trained by the training flag", async () => {
    mockRoster([person("Ada", true), person("Grace"), person("Alan", true)]);

    await expect(getRecruitCounts()).resolves.toEqual({
      mobilized: 3,
      trained: 2,
      sent: 0,
    });
  });

  it("counts Sent only when trained and funded", async () => {
    mockRoster([person("Ada", true, true), person("Grace", true), person("Alan")]);

    await expect(getRecruitCounts()).resolves.toEqual({
      mobilized: 3,
      trained: 2,
      sent: 1,
    });
  });

  it("does not count fully funded without training as Sent", async () => {
    mockRoster([person("Ada", false, true), person("Grace", false, true)]);

    await expect(getRecruitCounts()).resolves.toEqual({
      mobilized: 2,
      trained: 0,
      sent: 0,
    });
  });
});

describe("couples count as two people", () => {
  it("counts a couple as two Mobilized", async () => {
    mockRoster([person("Jeremy and Lindsay Ziegenhorn")]);

    await expect(getRecruitCounts()).resolves.toEqual({
      mobilized: 2,
      trained: 0,
      sent: 0,
    });
  });

  it("counts a trained couple as two Trained", async () => {
    mockRoster([person("Jeremy and Lindsay", true)]);

    await expect(getRecruitCounts()).resolves.toEqual({
      mobilized: 2,
      trained: 2,
      sent: 0,
    });
  });

  it("counts a sent couple as two Sent", async () => {
    mockRoster([person("Jeremy and Lindsay", true, true)]);

    await expect(getRecruitCounts()).resolves.toEqual({
      mobilized: 2,
      trained: 2,
      sent: 2,
    });
  });

  it("mixes couples and individuals correctly", async () => {
    mockRoster([
      person("Jeremy and Lindsay", true, true),
      person("Ada Lovelace", true, true),
      person("Bob and Sue", true),
      person("Alan Turing"),
    ]);

    // people: 2 + 1 + 2 + 1 = 6 mobilized; trained 2 + 1 + 2 = 5; sent 2 + 1 = 3
    await expect(getRecruitCounts()).resolves.toEqual({
      mobilized: 6,
      trained: 5,
      sent: 3,
    });
  });

  it("does not inflate names that merely contain 'and'", async () => {
    mockRoster([person("Alexander Hamilton", true, true), person("Sandra Anderson", true)]);

    await expect(getRecruitCounts()).resolves.toEqual({
      mobilized: 2,
      trained: 2,
      sent: 1,
    });
  });

  it("counts a trio as three", async () => {
    mockRoster([person("Bob and Sue and Jim", true, true)]);

    await expect(getRecruitCounts()).resolves.toEqual({
      mobilized: 3,
      trained: 3,
      sent: 3,
    });
  });
});

describe("zero state", () => {
  it("returns all zeroes for an empty roster", async () => {
    mockRoster([]);

    await expect(getRecruitCounts()).resolves.toEqual({
      mobilized: 0,
      trained: 0,
      sent: 0,
    });
  });

  it("computes 0% progress from a zero Sent count", () => {
    expect(sentGoalPercent(0)).toBe(0);
  });
});

describe("progression invariant", () => {
  it("keeps Sent <= Trained <= Mobilized with couples in the mix", async () => {
    mockRoster([
      person("A and B", true, true),
      person("C and D", true),
      person("E and F"),
    ]);

    const counts = await getRecruitCounts();

    expect(counts.sent).toBeLessThanOrEqual(counts.trained);
    expect(counts.trained).toBeLessThanOrEqual(counts.mobilized);
    expect(counts).toEqual({ mobilized: 6, trained: 4, sent: 2 });
  });
});

describe("Sent / 300 percentage", () => {
  it("uses 300 as the goal", () => {
    expect(RECRUIT_SENT_GOAL).toBe(300);
  });

  it("computes the expected percentages", () => {
    expect(sentGoalPercent(0)).toBe(0);
    expect(sentGoalPercent(75)).toBe(25);
    expect(sentGoalPercent(150)).toBe(50);
    expect(sentGoalPercent(300)).toBe(100);
  });

  it("never exceeds 100 percent once the goal is passed", () => {
    expect(sentGoalPercent(301)).toBe(100);
    expect(sentGoalPercent(5000)).toBe(100);
  });
});
