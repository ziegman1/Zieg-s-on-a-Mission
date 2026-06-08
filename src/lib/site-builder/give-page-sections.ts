import { DEFAULT_SITE_COPY } from "@/data/site-copy-defaults";
import {
  DEFAULT_GIVE_TIERS,
  giveTiersFromPartnerFallback,
  type GiveTierRow,
} from "@/data/give-page-tiers";
import { getMonthlyGivingHref, getOneTimeGivingHref } from "@/data/partnership-content";
import { contentStr, sortedListItems } from "./content-utils";
import { registryFor } from "./registry";
import type { ListItem, PageSection } from "./types";

export function giveTierCardItems(
  tiers: GiveTierRow[],
  monthlyHref: string,
): ListItem[] {
  return tiers.map((tier, index) => ({
    id: `give-tier-${index}`,
    text: tier.amountLabel,
    visible: true,
    sortOrder: index,
    metadata: {
      href: monthlyHref,
    },
  }));
}

function giveLevelsCardsNeedSimplification(cards: ListItem[]): boolean {
  if (cards.length === 0) return false;
  return cards.some((card) => {
    const meta = card.metadata ?? {};
    return Boolean(meta.body || meta.cta || meta.giftNote || meta.amountLabel);
  });
}

function cardGridDefaults() {
  return registryFor("card_grid").defaultContent;
}

function buildLevelsCardGrid(
  existing: PageSection | undefined,
  tiers: GiveTierRow[],
  monthlyHref: string,
): PageSection {
  const gridDefaults = cardGridDefaults();
  const giveCopy = DEFAULT_SITE_COPY.givePage;
  const headline = existing ? contentStr(existing.content, "headline") : giveCopy.suggestedLevelsHeading;
  const intro = existing
    ? contentStr(existing.content, "body") || contentStr(existing.content, "intro")
    : giveCopy.suggestedLevelsIntro;

  return {
    id: existing?.id ?? "levels",
    pageKey: "give",
    sectionKey: "levels",
    sectionType: "card_grid",
    label: existing?.label ?? "Suggested levels",
    visible: existing?.visible ?? true,
    sortOrder: existing?.sortOrder ?? 2,
    content: {
      ...gridDefaults,
      headline,
      intro,
      cards: giveTierCardItems(tiers, monthlyHref),
      primaryCtaLabel: giveCopy.becomeMonthlyCta,
      primaryCtaUrl: monthlyHref,
    },
    settings: existing?.settings ?? registryFor("card_grid").defaultSettings ?? {},
  };
}

function patchTextSectionCtas(
  section: PageSection,
  patch: {
    primaryCtaLabel?: string;
    primaryCtaUrl?: string;
    secondaryCtaLabel?: string;
    secondaryCtaUrl?: string;
  },
): PageSection {
  return {
    ...section,
    content: {
      ...section.content,
      ...patch,
    },
  };
}

function sectionsEqual(a: PageSection[], b: PageSection[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Upgrade Give page sections to card_grid tiers and ensure CTA URLs exist.
 * Seeds DEFAULT_GIVE_TIERS first; falls back to partnerPage.tiers when seeding empty cards.
 */
export function migrateGivePageSections(sections: PageSection[]): {
  sections: PageSection[];
  changed: boolean;
} {
  const monthlyHref = getMonthlyGivingHref();
  const oneTimeHref = getOneTimeGivingHref();
  const giveCopy = DEFAULT_SITE_COPY.givePage;
  const partnerTiers = DEFAULT_SITE_COPY.partnerPage.tiers;

  let next = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
  let changed = false;

  const levelsIndex = next.findIndex((s) => s.sectionKey === "levels");
  const levels = levelsIndex >= 0 ? next[levelsIndex] : undefined;
  const cards = levels ? sortedListItems(levels.content.cards) : [];

  if (!levels || levels.sectionType !== "card_grid" || cards.length === 0) {
    const tiers =
      DEFAULT_GIVE_TIERS.length > 0
        ? DEFAULT_GIVE_TIERS
        : giveTiersFromPartnerFallback(partnerTiers);

    const migratedLevels = buildLevelsCardGrid(levels, tiers, monthlyHref);
    if (levelsIndex >= 0) {
      next[levelsIndex] = migratedLevels;
    } else {
      const monthlyIndex = next.findIndex((s) => s.sectionKey === "monthly");
      const insertAt = monthlyIndex >= 0 ? monthlyIndex + 1 : next.length;
      next.splice(insertAt, 0, migratedLevels);
      next = next.map((s, i) => ({ ...s, sortOrder: i }));
    }
    changed = true;
  } else if (
    levels?.sectionType === "card_grid" &&
    cards.length > 0 &&
    giveLevelsCardsNeedSimplification(cards)
  ) {
    next[levelsIndex] = {
      ...levels,
      content: {
        ...levels.content,
        cards: giveTierCardItems(DEFAULT_GIVE_TIERS, monthlyHref),
      },
    };
    changed = true;
  }

  const monthlyIndex = next.findIndex((s) => s.sectionKey === "monthly");
  if (monthlyIndex >= 0) {
    const monthly = next[monthlyIndex]!;
    const patched = patchTextSectionCtas(monthly, {
      primaryCtaLabel:
        contentStr(monthly.content, "primaryCtaLabel") || giveCopy.startMonthlyCta,
      primaryCtaUrl: contentStr(monthly.content, "primaryCtaUrl") || monthlyHref,
      secondaryCtaLabel:
        contentStr(monthly.content, "secondaryCtaLabel") || giveCopy.learnPartnerCta,
      secondaryCtaUrl: contentStr(monthly.content, "secondaryCtaUrl") || "/partner",
    });
    if (!sectionsEqual([monthly], [patched])) {
      next[monthlyIndex] = patched;
      changed = true;
    }
  }

  const onetimeIndex = next.findIndex((s) => s.sectionKey === "onetime");
  if (onetimeIndex >= 0) {
    const onetime = next[onetimeIndex]!;
    const patched = patchTextSectionCtas(onetime, {
      primaryCtaLabel:
        contentStr(onetime.content, "primaryCtaLabel") || giveCopy.oneTimeCta,
      primaryCtaUrl: contentStr(onetime.content, "primaryCtaUrl") || oneTimeHref,
    });
    if (!sectionsEqual([onetime], [patched])) {
      next[onetimeIndex] = patched;
      changed = true;
    }
  }

  const migratedLevels = next.find((s) => s.sectionKey === "levels");
  if (
    migratedLevels &&
    migratedLevels.sectionType === "card_grid" &&
    (!contentStr(migratedLevels.content, "primaryCtaUrl") ||
      !contentStr(migratedLevels.content, "primaryCtaLabel"))
  ) {
    const idx = next.findIndex((s) => s.sectionKey === "levels");
    next[idx] = {
      ...migratedLevels,
      content: {
        ...migratedLevels.content,
        primaryCtaLabel:
          contentStr(migratedLevels.content, "primaryCtaLabel") || giveCopy.becomeMonthlyCta,
        primaryCtaUrl: contentStr(migratedLevels.content, "primaryCtaUrl") || monthlyHref,
      },
    };
    changed = true;
  }

  if (!changed) return { sections, changed: false };
  return { sections: next, changed: !sectionsEqual(sections, next) };
}
