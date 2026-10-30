import { beforeEach, describe, expect, it, vi } from "vitest";

const transaction = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: (callback: (tx: unknown) => Promise<unknown>, options?: unknown) =>
      transaction(callback, options),
  },
}));

import { saveMinistryPersonChanges } from "./ministry-db";
import type { MinistrySaveSubmission } from "./ministry-save";

function personRow() {
  return {
    id: "person",
    displayName: "Ada",
    pathway: "TEAM_EXPANSION_RECRUIT" as const,
    notes: "",
    legacyRecruitId: null,
    householdId: null,
    jonathanTrainingComplete: true,
    fullyFunded: true,
    mobilized: true,
    mobilizedOn: null,
    trainedEquipped: true,
    trainedEquippedOn: null,
    sent: true,
    sentOn: new Date("2019-06-01T00:00:00.000Z"),
    sentDesignation: "D_COURSE" as const,
    sentVerifiedAt: new Date("2019-06-01T00:00:00.000Z"),
    sentVerifiedBy: "Coach",
    sentVerificationNote: "Launched",
    milestoneAudit: "",
    createdAt: new Date("2019-01-01T00:00:00.000Z"),
    updatedAt: new Date("2019-01-01T00:00:00.000Z"),
  };
}

const submission: MinistrySaveSubmission = {
  pathway: "TEAM_EXPANSION_RECRUIT",
  jonathanTrainingComplete: false,
  fullyFunded: false,
  mobilized: true,
  mobilizedOn: null,
  trainedEquipped: false,
  trainedEquippedOn: null,
  sent: false,
  sentOn: null,
  sentDesignation: null,
  sentVerifiedBy: "",
  sentVerificationNote: "",
  confirmHistoryChange: false,
};

describe("saveMinistryPersonChanges", () => {
  beforeEach(() => {
    transaction.mockReset();
  });

  it("rolls the transaction back when a later write fails", async () => {
    const updates: string[] = [];
    transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        ministryPerson: {
          findUnique: async ({ where }: { where: { id: string } }) => {
            if (where.id === "person") return personRow();
            if (where.id === "partner") return { id: "partner", householdId: null };
            return null;
          },
          update: async ({ where }: { where: { id: string } }) => {
            updates.push(where.id);
            if (where.id === "person") throw new Error("write failed");
            return { id: where.id };
          },
        },
      };
      return callback(tx);
    });

    await expect(
      saveMinistryPersonChanges("person", {
        displayName: "Ada",
        pathway: "TEAM_EXPANSION_RECRUIT",
        notes: "",
        legacyRecruitId: null,
        householdWithPersonId: "partner",
        submission: { ...submission, confirmHistoryChange: true },
        recordedOn: "2026-10-30",
      }),
    ).rejects.toThrow("write failed");

    expect(transaction).toHaveBeenCalledOnce();
    expect(updates).toEqual(["partner", "person"]);
    expect(transaction.mock.calls[0][1]).toMatchObject({ timeout: 60_000 });
  });

  it("does not write when confirmation is still required", async () => {
    const updates: string[] = [];
    transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        ministryPerson: {
          findUnique: async () => personRow(),
          update: async ({ where }: { where: { id: string } }) => {
            updates.push(where.id);
            return personRow();
          },
        },
      };
      return callback(tx);
    });

    await expect(
      saveMinistryPersonChanges("person", {
        displayName: "Ada",
        pathway: "TEAM_EXPANSION_RECRUIT",
        notes: "",
        legacyRecruitId: null,
        householdWithPersonId: null,
        submission,
        recordedOn: "2026-10-30",
      }),
    ).rejects.toThrow(/turn Sent off/);

    expect(updates).toEqual([]);
  });
});
