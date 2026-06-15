import {
  CAMPAIGN_PLEDGE_STORAGE_KEY,
  type PartnershipLevel,
} from "@/data/support-campaign-config";

export type StoredCampaignPledges = {
  /** Individual pledge amounts the visitor has indicated (may include duplicates when allowed). */
  pledges: number[];
  updatedAt: string;
};

export function emptyStoredPledges(): StoredCampaignPledges {
  return { pledges: [], updatedAt: new Date(0).toISOString() };
}

export function totalPledgedAmount(pledges: number[]): number {
  return pledges.reduce((sum, amount) => sum + amount, 0);
}

export function hasPledgedAmount(pledges: number[], amount: PartnershipLevel): boolean {
  return pledges.includes(amount);
}

/** Add a pledge unless the amount is already recorded and duplicates are not allowed. */
export function addPledgeAmount(
  current: StoredCampaignPledges,
  amount: PartnershipLevel,
  options: { allowDuplicate?: boolean } = {},
): StoredCampaignPledges {
  if (!options.allowDuplicate && hasPledgedAmount(current.pledges, amount)) {
    return current;
  }

  return {
    pledges: [...current.pledges, amount],
    updatedAt: new Date().toISOString(),
  };
}

export function removePledgeAtIndex(
  current: StoredCampaignPledges,
  index: number,
): StoredCampaignPledges {
  if (index < 0 || index >= current.pledges.length) return current;
  const pledges = current.pledges.filter((_, i) => i !== index);
  return { pledges, updatedAt: new Date().toISOString() };
}

export function clearStoredPledges(): StoredCampaignPledges {
  return { pledges: [], updatedAt: new Date().toISOString() };
}

export function parseStoredCampaignPledges(raw: string | null): StoredCampaignPledges {
  if (!raw) return emptyStoredPledges();
  try {
    const parsed = JSON.parse(raw) as Partial<StoredCampaignPledges>;
    if (!Array.isArray(parsed.pledges)) return emptyStoredPledges();
    const pledges = parsed.pledges.filter(
      (value): value is number => typeof value === "number" && value > 0,
    );
    return {
      pledges,
      updatedAt:
        typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return emptyStoredPledges();
  }
}

export function readCampaignPledgesFromStorage(
  storageKey = CAMPAIGN_PLEDGE_STORAGE_KEY,
): StoredCampaignPledges {
  if (typeof window === "undefined") return emptyStoredPledges();
  return parseStoredCampaignPledges(window.localStorage.getItem(storageKey));
}

export function writeCampaignPledgesToStorage(
  data: StoredCampaignPledges,
  storageKey = CAMPAIGN_PLEDGE_STORAGE_KEY,
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(data));
}
