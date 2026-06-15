import "server-only";

import { CAMPAIGN, CAMPAIGN_SLUG } from "@/data/support-campaign-config";
import { prisma } from "@/lib/db";

export type SupportCampaignState = {
  id: string;
  goalAmount: number;
  pledgedAmount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

function mapRow(row: {
  id: string;
  goalAmount: number;
  pledgedAmount: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}): SupportCampaignState {
  return {
    id: row.id,
    goalAmount: row.goalAmount,
    pledgedAmount: Math.max(0, row.pledgedAmount),
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    isActive: row.isActive,
  };
}

function defaultCampaignData() {
  return {
    id: CAMPAIGN_SLUG,
    goalAmount: CAMPAIGN.goal,
    pledgedAmount: 0,
    startDate: new Date(CAMPAIGN.startDate),
    endDate: new Date(CAMPAIGN.endDate),
    isActive: true,
  };
}

/** Load shared campaign totals; creates the row on first read if missing. */
export async function getSupportCampaignState(): Promise<SupportCampaignState> {
  const existing = await prisma.supportCampaignRecord.findUnique({
    where: { id: CAMPAIGN_SLUG },
  });

  if (existing) {
    return mapRow(existing);
  }

  const created = await prisma.supportCampaignRecord.create({
    data: defaultCampaignData(),
  });
  return mapRow(created);
}

export async function updateSupportCampaignPledgedAmount(
  pledgedAmount: number,
): Promise<SupportCampaignState> {
  const normalized = Math.max(0, Math.round(pledgedAmount));
  const row = await prisma.supportCampaignRecord.upsert({
    where: { id: CAMPAIGN_SLUG },
    create: { ...defaultCampaignData(), pledgedAmount: normalized },
    update: { pledgedAmount: normalized },
  });
  return mapRow(row);
}

export async function recordSupportCampaignPledgeIntent(input: {
  amount: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const amount = Math.round(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) return;

  await prisma.supportCampaignRecord.upsert({
    where: { id: CAMPAIGN_SLUG },
    create: defaultCampaignData(),
    update: {},
  });

  await prisma.supportCampaignPledgeIntentRecord.create({
    data: {
      campaignId: CAMPAIGN_SLUG,
      amount,
      metadata: (input.metadata ?? {}) as import("@prisma/client").Prisma.InputJsonValue,
    },
  });
}
