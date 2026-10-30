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

  it("creates one activity in the same transaction and rolls back when that write fails", async () => {
    const writes: string[] = [];
    transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        ministryPerson: {
          findUnique: async () => ({ ...personRow(), sent: false, sentDesignation: null, sentOn: null, sentVerifiedAt: null, sentVerifiedBy: null, sentVerificationNote: "" }),
          update: async ({ data }: { data: { sent: boolean; pathway: string } }) => {
            writes.push(`person:${data.pathway}:${data.sent}`);
            return { ...personRow(), activities: [] };
          },
        },
        ministryActivity: {
          findMany: async () => [{ id: "activity-1" }],
          create: async ({ data }: { data: { activityType: string; personId: string } }) => {
            writes.push(`create:${data.personId}:${data.activityType}`);
            throw new Error("activity write failed");
          },
          updateMany: async () => ({ count: 1 }),
          deleteMany: async () => ({ count: 1 }),
        },
      };
      return callback(tx);
    });

    await expect(
      saveMinistryPersonChanges("person", {
        displayName: "Ada",
        pathway: "NATIONAL_PARTNER",
        notes: "",
        legacyRecruitId: null,
        householdWithPersonId: null,
        submission: { ...submission, pathway: "NATIONAL_PARTNER", sent: false },
        recordedOn: "2026-10-30",
        activities: {
          create: {
            activityType: "FIDELIS",
            status: "COMPLETED",
            activityOn: null,
            location: "Hall",
            notes: "",
          },
          update: null,
          deleteIds: [],
        },
      }),
    ).rejects.toThrow("activity write failed");

    expect(transaction).toHaveBeenCalledOnce();
    expect(writes).toEqual(["person:NATIONAL_PARTNER:false", "create:person:FIDELIS"]);
  });

  it("does not change other activities when one owned activity is removed", async () => {
    const deleted: { id: string; personId: string }[] = [];
    transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        ministryPerson: {
          findUnique: async () => personRow(),
          update: async () => ({ ...personRow(), activities: [] }),
        },
        ministryActivity: {
          findMany: async () => [{ id: "activity-1" }, { id: "activity-2" }],
          deleteMany: async ({ where }: { where: { id: string; personId: string } }) => {
            deleted.push(where);
            return { count: 1 };
          },
          create: async () => {
            throw new Error("should not create");
          },
        },
      };
      return callback(tx);
    });

    await saveMinistryPersonChanges("person", {
      displayName: "Ada",
      pathway: "TEAM_EXPANSION_RECRUIT",
      notes: "",
      legacyRecruitId: null,
      householdWithPersonId: null,
      submission: {
        ...submission,
        jonathanTrainingComplete: true,
        fullyFunded: true,
        sentDesignation: "D_COURSE",
        confirmHistoryChange: true,
      },
      recordedOn: "2026-10-30",
      activities: { create: null, update: null, deleteIds: ["activity-1"] },
    });

    expect(deleted).toEqual([{ id: "activity-1", personId: "person" }]);
  });

  it("does not write the person when the activity is not theirs", async () => {
    const updates: string[] = [];
    transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        ministryPerson: {
          findUnique: async () => personRow(),
          update: async () => {
            updates.push("person");
            return personRow();
          },
        },
        ministryActivity: {
          findMany: async () => [],
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
        submission: {
          ...submission,
          jonathanTrainingComplete: true,
          fullyFunded: true,
          sentDesignation: "D_COURSE",
          confirmHistoryChange: true,
        },
        recordedOn: "2026-10-30",
        activities: { create: null, update: null, deleteIds: ["activity-9"] },
      }),
    ).rejects.toThrow("That activity no longer exists.");

    expect(updates).toEqual([]);
  });
});
