import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
const transaction = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    ministryNationalPartnerInitiative: {
      findUnique: (...args: unknown[]) => findUnique(...args),
    },
    $transaction: (callback: (tx: unknown) => Promise<unknown>) => transaction(callback),
  },
}));

import {
  createNationalPartnerInitiative,
  deleteNationalPartnerInitiative,
  updateNationalPartnerInitiative,
} from "./national-partner-initiatives-db";

const input = {
  nation: "Kenya",
  area: "Rift Valley",
  trainingType: "JONATHAN_TRAINING" as const,
  completedCount: 40,
  submissionKey: "11111111-1111-4111-8111-111111111111",
};

beforeEach(() => {
  findUnique.mockReset();
  transaction.mockReset();
});

describe("national partner initiative writes", () => {
  it("creates one initiative and an audit row without creating a person", async () => {
    findUnique.mockResolvedValue(null);
    const writes: string[] = [];
    transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        ministryNationalPartnerInitiative: {
          create: async ({ data }: { data: { completedCount: number; trainingType: string } }) => {
            writes.push(`create:${data.trainingType}:${data.completedCount}`);
            return { id: "initiative-1", ...data };
          },
        },
        ministryNationalPartnerInitiativeAudit: {
          create: async ({ data }: { data: { action: string; completedCount: number } }) => {
            writes.push(`audit:${data.action}:${data.completedCount}`);
          },
        },
      };
      return callback(tx);
    });

    const saved = await createNationalPartnerInitiative(input);
    expect(saved.completedCount).toBe(40);
    expect(writes).toEqual(["create:JONATHAN_TRAINING:40", "audit:CREATED:40"]);
    expect(transaction).toHaveBeenCalledOnce();
  });

  it("returns the original initiative when the same submission is sent again", async () => {
    findUnique.mockResolvedValue({
      id: "initiative-1",
      nation: "Kenya",
      area: "Rift Valley",
      trainingType: "JONATHAN_TRAINING",
      completedCount: 40,
    });

    const saved = await createNationalPartnerInitiative({ ...input, completedCount: 99 });
    expect(saved.id).toBe("initiative-1");
    expect(saved.completedCount).toBe(40);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("returns the first saved initiative when a concurrent insert hits the unique key", async () => {
    findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "initiative-1",
        nation: "Kenya",
        area: "Rift Valley",
        trainingType: "JONATHAN_TRAINING",
        completedCount: 40,
      });
    transaction.mockRejectedValue({ code: "P2002" });

    const saved = await createNationalPartnerInitiative({ ...input, completedCount: 99 });
    expect(saved.completedCount).toBe(40);
    expect(transaction).toHaveBeenCalledOnce();
  });

  it("updates the same initiative instead of creating another contribution", async () => {
    const writes: string[] = [];
    transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        ministryNationalPartnerInitiative: {
          findUnique: async () => ({
            id: "initiative-1",
            nation: "Kenya",
            area: "Rift Valley",
            trainingType: "JONATHAN_TRAINING",
            completedCount: 40,
          }),
          update: async ({ data }: { data: { completedCount: number } }) => {
            writes.push(`update:${data.completedCount}`);
            return {
              id: "initiative-1",
              nation: "Kenya",
              area: "Rift Valley",
              trainingType: "FOUR_FIELDS",
              completedCount: data.completedCount,
            };
          },
          create: async () => {
            throw new Error("should not create");
          },
        },
        ministryNationalPartnerInitiativeAudit: {
          create: async ({ data }: { data: { action: string; previousCompletedCount: number } }) => {
            writes.push(`audit:${data.action}:${data.previousCompletedCount}`);
          },
        },
      };
      return callback(tx);
    });

    const saved = await updateNationalPartnerInitiative("initiative-1", {
      nation: "Kenya",
      area: "Rift Valley",
      trainingType: "FOUR_FIELDS",
      completedCount: 25,
    });
    expect(saved.completedCount).toBe(25);
    expect(writes).toEqual(["update:25", "audit:UPDATED:40"]);
  });

  it("removes one initiative and records the count that left the totals", async () => {
    const writes: string[] = [];
    transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        ministryNationalPartnerInitiative: {
          findUnique: async () => ({
            id: "initiative-1",
            nation: "Kenya",
            area: "Rift Valley",
            trainingType: "MEDICAL_TRAINING",
            completedCount: 40,
          }),
          delete: async ({ where }: { where: { id: string } }) => {
            writes.push(`delete:${where.id}`);
          },
        },
        ministryNationalPartnerInitiativeAudit: {
          create: async ({ data }: { data: { action: string; completedCount: number } }) => {
            writes.push(`audit:${data.action}:${data.completedCount}`);
          },
        },
      };
      return callback(tx);
    });

    await deleteNationalPartnerInitiative("initiative-1");
    expect(writes).toEqual(["audit:DELETED:40", "delete:initiative-1"]);
  });
});
