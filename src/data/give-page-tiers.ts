import type { PartnerTierRow } from "./marketing-pages-defaults";

export type GiveTierRow = {
  amountLabel: string;
};

/** Default monthly giving amount cards for the Give page Site Builder grid. */
export const DEFAULT_GIVE_TIERS: GiveTierRow[] = [
  { amountLabel: "$50/mo" },
  { amountLabel: "$100/mo" },
  { amountLabel: "$150/mo" },
  { amountLabel: "$250/mo" },
  { amountLabel: "Custom Amount" },
];

/** Map legacy partner tiers into Give amount labels when defaults are unavailable. */
export function giveTiersFromPartnerFallback(partnerTiers: PartnerTierRow[]): GiveTierRow[] {
  return partnerTiers.map((tier) => ({
    amountLabel: tier.amountLabel.replace(/\s*\/\s*month/i, "/mo"),
  }));
}
