import { describe, expect, it } from "vitest";
import { DEFAULT_GIVE_TIERS } from "@/data/give-page-tiers";
import { defaultSectionsForPage } from "./defaults";
import { migrateGivePageSections } from "./give-page-sections";
import type { PageSection } from "./types";

describe("migrateGivePageSections", () => {
  it("converts legacy Give levels text_section into a card_grid with default tiers", () => {
    const legacyLevels: PageSection = {
      id: "levels-id",
      pageKey: "give",
      sectionKey: "levels",
      sectionType: "text_section",
      label: "Suggested levels",
      visible: true,
      sortOrder: 2,
      content: {
        headline: "Suggested monthly levels",
        body: "Choose what fits your family.",
      },
      settings: {},
    };

    const { sections, changed } = migrateGivePageSections([legacyLevels]);

    expect(changed).toBe(true);
    const levels = sections.find((s) => s.sectionKey === "levels");
    expect(levels?.sectionType).toBe("card_grid");
    expect(Array.isArray(levels?.content.cards)).toBe(true);
    expect((levels?.content.cards as unknown[]).length).toBe(DEFAULT_GIVE_TIERS.length);
    expect(levels?.content.primaryCtaLabel).toBeTruthy();
  });

  it("adds CTA URLs to monthly and one-time sections when missing", () => {
    const defaults = defaultSectionsForPage("give");
    const monthly = defaults.find((s) => s.sectionKey === "monthly")!;
    const onetime = defaults.find((s) => s.sectionKey === "onetime")!;
    const stripped = defaults.map((section) => {
      if (section.sectionKey === "monthly") {
        return {
          ...section,
          content: {
            ...section.content,
            primaryCtaUrl: "",
            secondaryCtaUrl: "",
          },
        };
      }
      if (section.sectionKey === "onetime") {
        return {
          ...section,
          content: {
            ...section.content,
            primaryCtaUrl: "",
          },
        };
      }
      return section;
    });

    const { sections, changed } = migrateGivePageSections(stripped);
    expect(changed).toBe(true);
    const migratedMonthly = sections.find((s) => s.sectionKey === "monthly")!;
    const migratedOnetime = sections.find((s) => s.sectionKey === "onetime")!;
    expect(migratedMonthly.content.primaryCtaUrl).toBeTruthy();
    expect(migratedMonthly.content.secondaryCtaUrl).toBe("/partner");
    expect(migratedOnetime.content.primaryCtaUrl).toBeTruthy();
    expect(monthly.content.primaryCtaLabel).toBe(migratedMonthly.content.primaryCtaLabel);
    expect(onetime.content.primaryCtaLabel).toBe(migratedOnetime.content.primaryCtaLabel);
  });

  it("seeds partner tiers only when default give tiers are unavailable", () => {
    const emptyLevels: PageSection = {
      id: "levels-id",
      pageKey: "give",
      sectionKey: "levels",
      sectionType: "card_grid",
      label: "Suggested levels",
      visible: true,
      sortOrder: 2,
      content: { headline: "Levels", intro: "Intro", cards: [] },
      settings: {},
    };

    const { sections, changed } = migrateGivePageSections([emptyLevels]);
    expect(changed).toBe(true);
    expect((sections.find((s) => s.sectionKey === "levels")?.content.cards as unknown[]).length).toBe(
      DEFAULT_GIVE_TIERS.length,
    );
  });
  it("simplifies legacy rich Give level cards to amount-only cards", () => {
    const richLevels: PageSection = {
      id: "levels-id",
      pageKey: "give",
      sectionKey: "levels",
      sectionType: "card_grid",
      label: "Suggested levels",
      visible: true,
      sortOrder: 2,
      content: {
        headline: "Suggested monthly levels",
        intro: "Choose what fits.",
        cards: [
          {
            id: "give-tier-0",
            text: "Prayer & Sending Partner",
            visible: true,
            sortOrder: 0,
            metadata: {
              amountLabel: "$50/month",
              body: "Long description",
              cta: "Give monthly",
              href: "/contact",
            },
          },
        ],
        primaryCtaLabel: "Become a Monthly Partner",
        primaryCtaUrl: "/contact",
      },
      settings: {},
    };

    const { sections, changed } = migrateGivePageSections([richLevels]);
    expect(changed).toBe(true);
    const cards = sections.find((s) => s.sectionKey === "levels")?.content.cards as Array<{
      text: string;
      metadata?: Record<string, unknown>;
    }>;
    expect(cards.length).toBe(DEFAULT_GIVE_TIERS.length);
    expect(cards[0]?.text).toBe("$50/mo");
    expect(cards[0]?.metadata?.body).toBeUndefined();
    expect(cards[0]?.metadata?.cta).toBeUndefined();
  });
});

describe("defaultGiveSections", () => {
  it("includes card_grid levels with five amount-only tiers", () => {
    const sections = defaultSectionsForPage("give");
    const levels = sections.find((s) => s.sectionKey === "levels");
    expect(levels?.sectionType).toBe("card_grid");
    const cards = levels?.content.cards as Array<{ text: string; metadata?: Record<string, unknown> }>;
    expect(cards.length).toBe(5);
    expect(cards[0]?.text).toBe("$50/mo");
    expect(cards[4]?.text).toBe("Custom Amount");
    expect(cards[0]?.metadata?.body).toBeUndefined();
  });
});
