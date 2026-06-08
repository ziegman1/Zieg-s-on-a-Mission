import type { PartnerTierRow } from "./marketing-pages-defaults";

export type GiveTierRow = {
  amountLabel: string;
  name: string;
  description: string;
  giftNote?: string;
  ctaLabel?: string;
  href?: string;
};

/** Default monthly giving tiers for the Give page Site Builder card grid. */
export const DEFAULT_GIVE_TIERS: GiveTierRow[] = [
  {
    amountLabel: "$50/month",
    name: "Prayer & Sending Partner",
    description:
      "Sustain prayer, sending, and everyday gospel advance where God opens doors.",
  },
  {
    amountLabel: "$100/month",
    name: "Training Partner",
    description:
      "Help strengthen disciple-making, coaching, and equipping believers for the mission.",
  },
  {
    amountLabel: "$150/month",
    name: "Mobilization Partner",
    description:
      "Fuel mobilization efforts that help workers and churches reach those who have yet to hear.",
  },
  {
    amountLabel: "$250/month",
    name: "Mission Advancement Partner",
    description:
      "Provide deeper support for sustained ministry impact and long-range gospel advance.",
  },
  {
    amountLabel: "Other amount",
    name: "Custom Partnership",
    description:
      "Choose a monthly amount that fits your family — every partnership helps sustain the work.",
    ctaLabel: "Talk with us",
    href: "/contact",
  },
];

/** Map legacy partner tiers into Give card shape when Give levels need seeding. */
export function giveTiersFromPartnerFallback(partnerTiers: PartnerTierRow[]): GiveTierRow[] {
  return partnerTiers.map((tier) => ({
    amountLabel: tier.amountLabel.replace(" / month", "/month"),
    name: tier.name,
    description: tier.description,
    giftNote: tier.giftNote,
    ctaLabel: "Give monthly",
  }));
}
