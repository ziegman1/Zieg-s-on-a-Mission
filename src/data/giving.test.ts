import { describe, expect, it } from "vitest";
import {
  CANONICAL_GIVING_URL,
  isLegacyGivingHref,
  migrateGivingUrlsInSectionContent,
  resolveGivingHref,
} from "./giving";
import { GIVE_NOW_NAV, STOREFRONT_FOOTER_NAV } from "./storefront-navigation";
import { MINISTRY_FUNDING_INVITATION } from "./ministry-funding-content";
import { CAMPAIGN_GIVING_URL } from "./support-campaign-config";
import { getMonthlyGivingHref, getOneTimeGivingHref } from "./partnership-content";

describe("canonical Mission Multiplied giving URL", () => {
  it("exposes the campaign destination", () => {
    expect(CANONICAL_GIVING_URL).toBe(
      "https://mission-multiplied.raiselysite.com/jeremy-ziegenhorn",
    );
  });

  it("powers header Give Now and footer Give links", () => {
    expect(GIVE_NOW_NAV.href).toBe(CANONICAL_GIVING_URL);
    expect(STOREFRONT_FOOTER_NAV.some((l) => l.href === CANONICAL_GIVING_URL && l.label === "Give")).toBe(
      true,
    );
  });

  it("powers ministry-funding invitation and campaign pledge CTAs", () => {
    expect(MINISTRY_FUNDING_INVITATION.primaryCtaUrl).toBe(CANONICAL_GIVING_URL);
    expect(CAMPAIGN_GIVING_URL).toBe(CANONICAL_GIVING_URL);
  });

  it("resolves monthly and one-time helpers to the canonical URL by default", () => {
    expect(getMonthlyGivingHref()).toBe(CANONICAL_GIVING_URL);
    expect(getOneTimeGivingHref()).toBe(CANONICAL_GIVING_URL);
  });

  it("treats /give and legacy Aplos as legacy giving hrefs", () => {
    expect(isLegacyGivingHref("/give")).toBe(true);
    expect(isLegacyGivingHref("/give?ref=nav")).toBe(true);
    expect(
      isLegacyGivingHref(
        "https://app.aplos.com/aws/give/TeamExpansion/jeremylindsayZiegenhorn",
      ),
    ).toBe(true);
    expect(isLegacyGivingHref("/partner")).toBe(false);
    expect(isLegacyGivingHref("/ministry-funding")).toBe(false);
  });

  it("resolveGivingHref rewrites legacy and empty values", () => {
    expect(resolveGivingHref(undefined)).toBe(CANONICAL_GIVING_URL);
    expect(resolveGivingHref("/give")).toBe(CANONICAL_GIVING_URL);
    expect(resolveGivingHref("/partner")).toBe("/partner");
    expect(resolveGivingHref(CANONICAL_GIVING_URL)).toBe(CANONICAL_GIVING_URL);
  });

  it("migrates Site Builder CTA and card hrefs in place", () => {
    const content: Record<string, unknown> = {
      primaryCtaUrl: "/give",
      secondaryCtaUrl: "/partner",
      cards: [{ id: "1", metadata: { href: "/give" } }],
      bullets: [{ href: "/give", text: "Give" }],
    };
    expect(migrateGivingUrlsInSectionContent(content)).toBe(true);
    expect(content.primaryCtaUrl).toBe(CANONICAL_GIVING_URL);
    expect(content.secondaryCtaUrl).toBe("/partner");
    expect((content.cards as { metadata: { href: string } }[])[0].metadata.href).toBe(
      CANONICAL_GIVING_URL,
    );
    expect((content.bullets as { href: string }[])[0].href).toBe(CANONICAL_GIVING_URL);
  });
});
