import { afterEach, describe, expect, it, vi } from "vitest";

const { transactionMock } = vi.hoisted(() => ({
  transactionMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    supportCampaignRecord: {
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    supportCampaignPledgeIntentRecord: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: transactionMock,
  },
}));

import { prisma } from "@/lib/db";
import {
  addSupportCampaignPledge,
  getSupportCampaignState,
  updateSupportCampaignPledgedAmount,
} from "@/lib/support-campaign/campaign-state";

const mocked = vi.mocked(prisma.supportCampaignRecord);

const sampleRow = {
  id: "support-campaign-2026",
  goalAmount: 2000,
  pledgedAmount: 0,
  startDate: new Date("2026-06-15T21:50:00.000Z"),
  endDate: new Date("2026-06-22T21:50:00.000Z"),
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("campaign-state", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("creates a default campaign row when missing instead of throwing", async () => {
    mocked.findUnique.mockResolvedValueOnce(null);
    mocked.create.mockResolvedValueOnce(sampleRow);

    const state = await getSupportCampaignState();

    expect(mocked.create).toHaveBeenCalledOnce();
    expect(state.id).toBe("support-campaign-2026");
    expect(state.goalAmount).toBe(2000);
    expect(state.pledgedAmount).toBe(0);
  });

  it("returns existing pledged amount from the database", async () => {
    mocked.findUnique.mockResolvedValueOnce({ ...sampleRow, pledgedAmount: 750 });

    const state = await getSupportCampaignState();

    expect(state.pledgedAmount).toBe(750);
    expect(mocked.create).not.toHaveBeenCalled();
  });

  it("updates pledged amount via upsert", async () => {
    mocked.upsert.mockResolvedValueOnce({ ...sampleRow, pledgedAmount: 1250 });

    const state = await updateSupportCampaignPledgedAmount(1250);

    expect(mocked.upsert).toHaveBeenCalledOnce();
    expect(state.pledgedAmount).toBe(1250);
  });

  it("increments pledged amount and logs a public card click", async () => {
    transactionMock.mockImplementationOnce(async (fn: (tx: typeof prisma) => Promise<unknown>) => {
      const tx = {
        supportCampaignRecord: {
          upsert: vi.fn().mockResolvedValue({ ...sampleRow, pledgedAmount: 100 }),
        },
        supportCampaignPledgeIntentRecord: {
          create: vi.fn().mockResolvedValue({
            id: "intent-1",
            campaignId: "support-campaign-2026",
            amount: 100,
            metadata: { source: "public_card_click" },
            createdAt: new Date(),
          }),
        },
      };
      return fn(tx as unknown as typeof prisma);
    });

    const state = await addSupportCampaignPledge(100);

    expect(transactionMock).toHaveBeenCalledOnce();
    expect(state.pledgedAmount).toBe(100);
  });

  it("accumulates pledged amount across multiple completed increments", async () => {
    transactionMock
      .mockImplementationOnce(async (fn: (tx: typeof prisma) => Promise<unknown>) => {
        const tx = {
          supportCampaignRecord: {
            upsert: vi.fn().mockResolvedValue({ ...sampleRow, pledgedAmount: 100 }),
          },
          supportCampaignPledgeIntentRecord: { create: vi.fn() },
        };
        return fn(tx as unknown as typeof prisma);
      })
      .mockImplementationOnce(async (fn: (tx: typeof prisma) => Promise<unknown>) => {
        const tx = {
          supportCampaignRecord: {
            upsert: vi.fn().mockResolvedValue({ ...sampleRow, pledgedAmount: 350 }),
          },
          supportCampaignPledgeIntentRecord: { create: vi.fn() },
        };
        return fn(tx as unknown as typeof prisma);
      });

    const first = await addSupportCampaignPledge(100);
    const second = await addSupportCampaignPledge(250);

    expect(first.pledgedAmount).toBe(100);
    expect(second.pledgedAmount).toBe(350);
    expect(transactionMock).toHaveBeenCalledTimes(2);
  });
});
