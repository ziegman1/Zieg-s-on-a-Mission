import { cache } from "react";
import { DEFAULT_SITE_COPY } from "@/data/site-copy-defaults";
import {
  GET_INVOLVED_NAV,
  GIVE_NOW_NAV,
  STOREFRONT_FOOTER_NAV,
  STOREFRONT_HEADER_NAV,
  type GetInvolvedNavItem,
  type StorefrontNavLink,
} from "@/data/storefront-navigation";
import { getSiteCopy, getSiteCopyBlocksForAdmin } from "@/lib/site-copy";
import { resolveNavigationExtras } from "@/lib/site-copy-blocks/navigation-extras";
import { contentStr, visibleListItems } from "@/lib/site-builder/content-utils";
import { buildFormattedContentHtml } from "@/lib/site-builder/formatted-content";
import { loadPageSections, pageHasCustomSections } from "@/lib/site-builder/sections-db";
import type { PageSection } from "@/lib/site-builder/types";

export type GlobalContentSource = "site_page_sections" | "site_copy" | "hardcoded";

export type ResolvedGlobalField<T> = {
  value: T;
  source: GlobalContentSource;
  databaseKey: string;
  table: string;
};

export type ResolvedStorefrontShell = {
  hasCustomGlobalSections: boolean;
  siteName: ResolvedGlobalField<string>;
  footerBlurb: ResolvedGlobalField<string>;
  footerNavLinks: ResolvedGlobalField<StorefrontNavLink[]>;
  headerNavLabelOverrides: ResolvedGlobalField<Record<string, string>>;
  giveNow: ResolvedGlobalField<StorefrontNavLink>;
  getInvolved: ResolvedGlobalField<{
    label: string;
    labelHref: string;
    items: GetInvolvedNavItem[];
  }>;
  legalSupport: ResolvedGlobalField<{
    supportEmail: string;
    supportResponseTime: string;
  }>;
};

const DEBUG_ENABLED =
  process.env.GLOBAL_STOREFRONT_DEBUG === "1" ||
  process.env.FOOTER_BLURB_DEBUG === "1" ||
  process.env.NODE_ENV === "development";

function logGlobalFieldDebug(
  field: string,
  resolved: ResolvedGlobalField<unknown>,
  hasCustomGlobalSections: boolean,
): void {
  if (!DEBUG_ENABLED) return;

  const preview =
    typeof resolved.value === "string"
      ? resolved.value.slice(0, 240)
      : JSON.stringify(resolved.value).slice(0, 240);

  console.info("[global-storefront]", {
    field,
    source: resolved.source,
    databaseKey: resolved.databaseKey,
    table: resolved.table,
    hasCustomGlobalSections,
    value: preview,
  });
}

function storedTextToPlain(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return buildFormattedContentHtml(trimmed)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseNavBulletLine(line: string): { label: string; href: string } | null {
  const plain = storedTextToPlain(line);
  if (!plain) return null;

  const match = plain.match(/^(.+?)\s→\s(\S+)/);
  if (!match) return null;

  const label = match[1]!.replace(/\s*\(dropdown\)\s*$/i, "").trim();
  const href = match[2]!.split(",")[0]!.trim();
  if (!label || !href.startsWith("/")) return null;

  return { label, href };
}

function globalSection(
  sections: PageSection[],
  sectionKey: string,
): PageSection | undefined {
  return sections.find((section) => section.sectionKey === sectionKey && section.visible);
}

function siteBuilderField(
  hasCustomGlobalSections: boolean,
  sectionKey: string,
  fieldKey: string,
  value: string,
): string {
  if (!hasCustomGlobalSections) return "";
  return storedTextToPlain(value);
}

function resolveFromSources<T>({
  hasCustomGlobalSections,
  siteBuilderValue,
  legacyValue,
  hardcodedValue,
  siteBuilderKey,
  legacyKey,
  legacyTable = "site_copy.payload",
}: {
  hasCustomGlobalSections: boolean;
  siteBuilderValue: T | null | undefined;
  legacyValue: T | null | undefined;
  hardcodedValue: T;
  siteBuilderKey: string;
  legacyKey: string;
  legacyTable?: string;
}): ResolvedGlobalField<T> {
  if (hasCustomGlobalSections && siteBuilderValue != null) {
    if (typeof siteBuilderValue === "string" && !siteBuilderValue.trim()) {
      // fall through
    } else if (Array.isArray(siteBuilderValue) && siteBuilderValue.length === 0) {
      // fall through
    } else {
      return {
        value: siteBuilderValue,
        source: "site_page_sections",
        databaseKey: siteBuilderKey,
        table: "site_page_sections",
      };
    }
  }

  if (legacyValue != null) {
    if (typeof legacyValue === "string" && legacyValue.trim()) {
      return {
        value: legacyValue,
        source: "site_copy",
        databaseKey: legacyKey,
        table: legacyTable,
      };
    }
    if (Array.isArray(legacyValue) && legacyValue.length > 0) {
      return {
        value: legacyValue,
        source: "site_copy",
        databaseKey: legacyKey,
        table: legacyTable,
      };
    }
    if (typeof legacyValue !== "string" && !Array.isArray(legacyValue)) {
      return {
        value: legacyValue,
        source: "site_copy",
        databaseKey: legacyKey,
        table: legacyTable,
      };
    }
  }

  return {
    value: hardcodedValue,
    source: "hardcoded",
    databaseKey: legacyKey,
    table: "storefront-navigation.ts / site-copy-defaults.ts",
  };
}

function resolveFooterNavFromBullets(bullets: { text: string }[]): StorefrontNavLink[] {
  const parsed = bullets
    .map((bullet) => parseNavBulletLine(bullet.text))
    .filter((entry): entry is StorefrontNavLink => Boolean(entry));

  return parsed.length > 0 ? parsed : STOREFRONT_FOOTER_NAV;
}

function resolveHeaderNavOverridesFromBullets(bullets: { text: string }[]): Record<string, string> {
  const overrides: Record<string, string> = {};

  for (const bullet of bullets) {
    const parsed = parseNavBulletLine(bullet.text);
    if (!parsed) continue;
    overrides[parsed.href] = parsed.label;
  }

  return overrides;
}

function resolveGetInvolvedFromSection(section: PageSection | undefined): {
  label: string;
  items: GetInvolvedNavItem[];
} | null {
  if (!section) return null;

  const label = storedTextToPlain(contentStr(section.content, "headline"));
  const cards = visibleListItems(section.content.cards);
  const items = cards
    .map((card) => {
      const href = String(card.metadata?.href ?? "").trim();
      const itemLabel = storedTextToPlain(card.text);
      const description = storedTextToPlain(String(card.metadata?.body ?? ""));
      if (!href.startsWith("/") || !itemLabel) return null;
      return { href, label: itemLabel, description: description || undefined };
    })
    .filter((item): item is GetInvolvedNavItem => Boolean(item));

  if (!label && items.length === 0) return null;
  return { label: label || GET_INVOLVED_NAV.label, items };
}

/** Live header/footer shell content — Site Builder Global sections first, site_copy fallback. */
export const resolveStorefrontShellContent = cache(async (): Promise<ResolvedStorefrontShell> => {
  const hasCustomGlobalSections = await pageHasCustomSections("global");
  const sections = await loadPageSections("global");
  const copy = await getSiteCopy();
  const navBlocks = await getSiteCopyBlocksForAdmin();
  const navExtras = resolveNavigationExtras(navBlocks);

  const siteMeta = globalSection(sections, "site-meta");
  const headerNav = globalSection(sections, "header-nav");
  const getInvolvedSection = globalSection(sections, "get-involved-menu");
  const giveNowSection = globalSection(sections, "give-now-button");
  const footerNavSection = globalSection(sections, "footer-nav");
  const footerSection = globalSection(sections, "footer");
  const legalSection = globalSection(sections, "legal");

  const siteName = resolveFromSources({
    hasCustomGlobalSections,
    siteBuilderValue: siteBuilderField(
      hasCustomGlobalSections,
      "site-meta",
      "headline",
      contentStr(siteMeta?.content, "headline"),
    ),
    legacyValue: copy.site.name.trim(),
    hardcodedValue: DEFAULT_SITE_COPY.site.name,
    siteBuilderKey: "global.site-meta.headline",
    legacyKey: "site.name",
  });

  const footerBlurb = resolveFromSources({
    hasCustomGlobalSections,
    siteBuilderValue: siteBuilderField(
      hasCustomGlobalSections,
      "footer",
      "body",
      contentStr(footerSection?.content, "body"),
    ),
    legacyValue: copy.footer.blurb.trim(),
    hardcodedValue: DEFAULT_SITE_COPY.footer.blurb,
    siteBuilderKey: "global.footer.body",
    legacyKey: "footer.blurb",
  });

  const footerNavLinks = resolveFromSources({
    hasCustomGlobalSections,
    siteBuilderValue: footerNavSection
      ? resolveFooterNavFromBullets(visibleListItems(footerNavSection.content.bullets))
      : null,
    legacyValue: null,
    hardcodedValue: STOREFRONT_FOOTER_NAV,
    siteBuilderKey: "global.footer-nav.bullets",
    legacyKey: "footer.navigation",
  });

  const headerOverridesFromBuilder = headerNav
    ? resolveHeaderNavOverridesFromBullets(visibleListItems(headerNav.content.bullets))
    : {};
  const getInvolvedFromBuilder = resolveGetInvolvedFromSection(getInvolvedSection);
  if (getInvolvedFromBuilder?.label) {
    headerOverridesFromBuilder[GET_INVOLVED_NAV.labelHref] = getInvolvedFromBuilder.label;
  }

  const legacyHeaderOverrides = Object.fromEntries(copy.navLinks.map((link) => [link.href, link.label]));

  const headerNavLabelOverrides = resolveFromSources({
    hasCustomGlobalSections,
    siteBuilderValue:
      hasCustomGlobalSections && Object.keys(headerOverridesFromBuilder).length > 0
        ? headerOverridesFromBuilder
        : null,
    legacyValue: legacyHeaderOverrides,
    hardcodedValue: Object.fromEntries(
      STOREFRONT_HEADER_NAV.map((link) => [link.href, link.label]),
    ),
    siteBuilderKey: "global.header-nav.bullets",
    legacyKey: "nav.link.*",
  });

  const giveNowLabel =
    siteBuilderField(
      hasCustomGlobalSections,
      "give-now-button",
      "primaryCtaLabel",
      contentStr(giveNowSection?.content, "primaryCtaLabel"),
    ) ||
    siteBuilderField(
      hasCustomGlobalSections,
      "give-now-button",
      "headline",
      contentStr(giveNowSection?.content, "headline"),
    );
  const giveNowHref =
    contentStr(giveNowSection?.content, "primaryCtaUrl").trim() || GIVE_NOW_NAV.href;

  const giveNow = resolveFromSources({
    hasCustomGlobalSections,
    siteBuilderValue: giveNowLabel ? { href: giveNowHref, label: giveNowLabel } : null,
    legacyValue: { href: GIVE_NOW_NAV.href, label: navExtras.giveNowLabel },
    hardcodedValue: GIVE_NOW_NAV,
    siteBuilderKey: "global.give-now-button.primaryCtaLabel",
    legacyKey: "nav.giveNow.label",
  });

  const getInvolvedItemsFromBuilder = getInvolvedFromBuilder?.items ?? [];
  const getInvolved = resolveFromSources({
    hasCustomGlobalSections,
    siteBuilderValue:
      getInvolvedFromBuilder && getInvolvedItemsFromBuilder.length > 0
        ? {
            label: getInvolvedFromBuilder.label,
            labelHref: GET_INVOLVED_NAV.labelHref,
            items: getInvolvedItemsFromBuilder,
          }
        : null,
    legacyValue: {
      label:
        legacyHeaderOverrides[GET_INVOLVED_NAV.labelHref]?.trim() || GET_INVOLVED_NAV.label,
      labelHref: GET_INVOLVED_NAV.labelHref,
      items: navExtras.getInvolvedItems,
    },
    hardcodedValue: {
      label: GET_INVOLVED_NAV.label,
      labelHref: GET_INVOLVED_NAV.labelHref,
      items: GET_INVOLVED_NAV.items,
    },
    siteBuilderKey: "global.get-involved-menu.cards",
    legacyKey: "nav.getInvolved.*",
  });

  const legalEmail = siteBuilderField(
    hasCustomGlobalSections,
    "legal",
    "headline",
    contentStr(legalSection?.content, "headline"),
  );
  const legalResponseTime = siteBuilderField(
    hasCustomGlobalSections,
    "legal",
    "body",
    contentStr(legalSection?.content, "body"),
  );

  const legalSupport = resolveFromSources({
    hasCustomGlobalSections,
    siteBuilderValue: legalEmail
      ? {
          supportEmail: legalEmail,
          supportResponseTime:
            legalResponseTime ||
            copy.legalSupport.supportResponseTime.trim() ||
            DEFAULT_SITE_COPY.legalSupport.supportResponseTime,
        }
      : null,
    legacyValue: {
      supportEmail: copy.legalSupport.supportEmail.trim(),
      supportResponseTime: copy.legalSupport.supportResponseTime.trim(),
    },
    hardcodedValue: DEFAULT_SITE_COPY.legalSupport,
    siteBuilderKey: "global.legal.headline/body",
    legacyKey: "legal.supportEmail / legal.supportResponseTime",
  });

  const resolved: ResolvedStorefrontShell = {
    hasCustomGlobalSections,
    siteName,
    footerBlurb,
    footerNavLinks,
    headerNavLabelOverrides,
    giveNow,
    getInvolved,
    legalSupport,
  };

  logGlobalFieldDebug("siteName", siteName, hasCustomGlobalSections);
  logGlobalFieldDebug("footerBlurb", footerBlurb, hasCustomGlobalSections);
  logGlobalFieldDebug("footerNavLinks", footerNavLinks, hasCustomGlobalSections);
  logGlobalFieldDebug("headerNavLabelOverrides", headerNavLabelOverrides, hasCustomGlobalSections);
  logGlobalFieldDebug("giveNow", giveNow, hasCustomGlobalSections);
  logGlobalFieldDebug("getInvolved", getInvolved, hasCustomGlobalSections);
  logGlobalFieldDebug("legalSupport", legalSupport, hasCustomGlobalSections);

  return resolved;
});

/** @deprecated Use resolveStorefrontShellContent().footerBlurb */
export const resolveFooterBlurb = cache(async () => {
  const shell = await resolveStorefrontShellContent();
  return {
    text: shell.footerBlurb.value,
    source: shell.footerBlurb.source,
    databaseKey: shell.footerBlurb.databaseKey,
    table: shell.footerBlurb.table,
    hasCustomGlobalSections: shell.hasCustomGlobalSections,
  };
});

export const FOOTER_BLURB_SITE_BUILDER_KEY = "global.footer.body";
export const FOOTER_BLURB_LEGACY_KEY = "footer.blurb";
