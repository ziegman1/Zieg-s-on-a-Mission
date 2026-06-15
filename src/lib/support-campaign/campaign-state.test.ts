import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    supportCampaignRecord: {
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    supportCampaignPledgeIntentRecord: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import {
  getSupportCampaignState,
  recordSupportCampaignPledgeIntent,
  updateSupportCampaignPledgedAmount,
} from "@/lib/support-campaign/campaign-state";

const mocked = vi.mocked(prisma.supportCampaignRecord);
const mockedIntents = vi.mocked(prisma.supportCampaignPledgeIntentRecord);

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

  it("records pledge intent without updating pledged amount", async () => {
    mocked.upsert.mockResolvedValueOnce(sampleRow);
    mockedIntents.create.mockResolvedValueOnce({
      id: "intent-1",
      campaignId: "support-campaign-2026",
      amount: 100,
      metadata: {},
      createdAt: new Date(),
    });

    await recordSupportCampaignPledgeIntent({ amount: 100 });

    expect(mockedIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ amount: 100 }) }),
    );
    expect(mocked.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: {} }),
    );
  });
});
