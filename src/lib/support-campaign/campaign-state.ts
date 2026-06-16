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

/** Add a public partnership-card pledge to the shared total and log the click. */
export async function addSupportCampaignPledge(amount: number): Promise<SupportCampaignState> {
  const normalized = Math.round(amount);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return getSupportCampaignState();
  }

  const row = await prisma.$transaction(async (tx) => {
    const campaign = await tx.supportCampaignRecord.upsert({
      where: { id: CAMPAIGN_SLUG },
      create: { ...defaultCampaignData(), pledgedAmount: normalized },
      update: { pledgedAmount: { increment: normalized } },
    });

    await tx.supportCampaignPledgeIntentRecord.create({
      data: {
        campaignId: CAMPAIGN_SLUG,
        amount: normalized,
        metadata: { source: "public_card_click" },
      },
    });

    return campaign;
  });

  return mapRow(row);
}

export type SupportCampaignPledgeIntent = {
  id: string;
  amount: number;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export async function listRecentSupportCampaignPledgeIntents(
  limit = 50,
): Promise<SupportCampaignPledgeIntent[]> {
  const rows = await prisma.supportCampaignPledgeIntentRecord.findMany({
    where: { campaignId: CAMPAIGN_SLUG },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, amount: true, createdAt: true, metadata: true },
  });

  return rows.map((row) => ({
    id: row.id,
    amount: row.amount,
    createdAt: row.createdAt.toISOString(),
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {},
  }));
}
