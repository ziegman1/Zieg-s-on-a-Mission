import { DEFAULT_SITE_COPY, type NavLinkDef, type SiteCopy } from "@/data/site-copy-defaults";
import { GET_INVOLVED_NAV } from "@/data/storefront-navigation";
import type { ContentBlock } from "./types";
import { sortBlocks, visibleLines } from "./utils";

/** Missing block → code default; hidden block → empty (no fallback). */
function fieldValue(
  byKey: Map<string, ContentBlock>,
  key: string,
  defaultVal: string,
): string {
  const b = byKey.get(key);
  if (!b) return defaultVal;
  if (!b.visible) return "";
  const v = b.value?.trim() ?? "";
  return v.length > 0 ? v : defaultVal;
}

function str(block: ContentBlock | undefined): string {
  if (!block?.visible) return "";
  return block.value?.trim() ?? "";
}

function lineTexts(block: ContentBlock | undefined): string[] {
  if (!block?.visible) return [];
  return visibleLines(block.lines).map((l) => l.text.trim());
}

/** Match saved nav label blocks by href so new default links are not dropped when indices shift. */
function navBlockForLink(
  blocks: ContentBlock[],
  byKey: Map<string, ContentBlock>,
  def: NavLinkDef,
  index: number,
): ContentBlock | undefined {
  const navBlocks = blocks.filter(
    (b) => b.pageKey === "global" && b.sectionKey === "navigation",
  );
  const byHref = navBlocks.find((b) => b.metadata?.href === def.href);
  if (byHref) return byHref;

  const byIndex = byKey.get(`nav.link.${index}`);
  if (!byIndex) return undefined;
  const blockHref = byIndex.metadata?.href;
  if (typeof blockHref === "string" && blockHref !== def.href) return undefined;
  return byIndex;
}

/** Apply flexible blocks onto SiteCopy (v2: hidden/deleted fields stay empty; no default fill-in). */
export function blocksToSiteCopy(blocks: ContentBlock[]): SiteCopy {
  const byKey = new Map(blocks.map((b) => [b.blockKey, b]));
  const d = DEFAULT_SITE_COPY;
  const get = (key: string) => byKey.get(key);

  const navLinks: NavLinkDef[] = d.navLinks
    .map((def, i) => {
      const b = navBlockForLink(blocks, byKey, def, i);
      if (!b) return def;
      if (!b.visible) return { href: def.href, label: "" };
      let label = str(b) || def.label;
      if (def.href === GET_INVOLVED_NAV.labelHref) {
        const saved = str(b);
        if (!saved || saved === "Partner" || saved === "Advocacy Team" || saved === "Give") {
          label = def.label;
        }
      }
      return { href: def.href, label };
    })
    .filter((l) => l.label.trim().length > 0);

  const navFinal = navLinks.length > 0 ? navLinks : d.navLinks;

  const aboutSectionsBlock = get("about.sections");
  const aboutSections =
    aboutSectionsBlock && !aboutSectionsBlock.visible
      ? []
      : aboutSectionsBlock
        ? visibleLines(aboutSectionsBlock.lines)
            .map((l) => ({
              heading: l.text.trim(),
              body: String(l.metadata?.body ?? "").trim(),
            }))
            .filter((s) => s.heading || s.body)
        : d.about.sections;

  const missionBulletsBlock = get("mission.bullets");
  const missionBullets =
    missionBulletsBlock && !missionBulletsBlock.visible
      ? []
      : missionBulletsBlock
        ? lineTexts(missionBulletsBlock)
        : d.mission.bullets;

  const blogTopicsBlock = get("blog.topics");
  const blogTopics =
    blogTopicsBlock && !blogTopicsBlock.visible
      ? []
      : blogTopicsBlock
        ? lineTexts(blogTopicsBlock)
        : d.blog.topics;

  const contactBulletsBlock = get("contact.helpBullets");
  const contactBullets =
    contactBulletsBlock && !contactBulletsBlock.visible
      ? []
      : contactBulletsBlock
        ? lineTexts(contactBulletsBlock)
        : d.contact.helpBullets;

  const homeGuidedSections = d.homeGuided.sections
    .map((def) => {
      const b = get(`homeGuided.section.${def.id}`);
      if (!b) return def;
      if (!b.visible) return null;
      const bodyLine = b.lines.find((l) => l.visible && l.metadata?.field === "body");
      const ctaLine = b.lines.find((l) => l.visible && l.metadata?.field === "ctaLabel");
      const title = str(b) || def.title;
      if (!title.trim() && !bodyLine?.text.trim()) return null;
      return {
        id: def.id,
        href: def.href,
        title,
        body: bodyLine?.text.trim() ?? def.body,
        ctaLabel: ctaLine?.text.trim() || def.ctaLabel,
        imageUrl: String(b.metadata?.imageUrl ?? def.imageUrl ?? ""),
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  const guidedFinal = homeGuidedSections;

  const partnerPage = resolvePartnerPage(byKey, d);
  const givePage = resolveGivePage(byKey, d);
  const merchPage = resolveMerchPage(byKey, d);

  return {
    site: {
      name: fieldValue(byKey, "site.name", d.site.name),
      tagline: fieldValue(byKey, "site.tagline", d.site.tagline),
      description: fieldValue(byKey, "site.description", d.site.description),
    },
    navLinks: navFinal,
    footer: {
      blurb: fieldValue(byKey, "footer.blurb", d.footer.blurb),
    },
    homeHero: {
      headline: fieldValue(byKey, "homeHero.headline", d.homeHero.headline),
      body: fieldValue(byKey, "homeHero.body", d.homeHero.body),
      primaryCtaLabel: fieldValue(byKey, "homeHero.primaryCtaLabel", d.homeHero.primaryCtaLabel),
      secondaryCtaLabel: fieldValue(
        byKey,
        "homeHero.secondaryCtaLabel",
        d.homeHero.secondaryCtaLabel,
      ),
    },
    homeGuided: {
      heroImageUrl: fieldValue(byKey, "homeGuided.heroImageUrl", d.homeGuided.heroImageUrl),
      heroLearnMoreLabel: fieldValue(
        byKey,
        "homeGuided.heroLearnMoreLabel",
        d.homeGuided.heroLearnMoreLabel,
      ),
      scrollBreakBody: fieldValue(byKey, "homeGuided.scrollBreakBody", d.homeGuided.scrollBreakBody),
      closingBody: fieldValue(byKey, "homeGuided.closingBody", d.homeGuided.closingBody),
      sections: guidedFinal,
    },
    home: {
      whoTitle: fieldValue(byKey, "home.whoTitle", d.home.whoTitle),
      whoBody: fieldValue(byKey, "home.whoBody", d.home.whoBody),
      whoCta: fieldValue(byKey, "home.whoCta", d.home.whoCta),
      whyTitle: fieldValue(byKey, "home.whyTitle", d.home.whyTitle),
      whyBody: fieldValue(byKey, "home.whyBody", d.home.whyBody),
      whyCta: fieldValue(byKey, "home.whyCta", d.home.whyCta),
      merchTitle: fieldValue(byKey, "home.merchTitle", d.home.merchTitle),
      merchBlurb: fieldValue(byKey, "home.merchBlurb", d.home.merchBlurb),
      featuredTitle: fieldValue(byKey, "home.featuredTitle", d.home.featuredTitle),
      featuredEmpty: fieldValue(byKey, "home.featuredEmpty", d.home.featuredEmpty),
      viewAllMerchLabel: fieldValue(byKey, "home.viewAllMerchLabel", d.home.viewAllMerchLabel),
    },
    about: {
      title: fieldValue(byKey, "about.title", d.about.title),
      lede: fieldValue(byKey, "about.lede", d.about.lede),
      sections: aboutSections,
    },
    mission: {
      title: fieldValue(byKey, "mission.title", d.mission.title),
      lede: fieldValue(byKey, "mission.lede", d.mission.lede),
      focusHeading: fieldValue(byKey, "mission.focusHeading", d.mission.focusHeading),
      bullets: missionBullets,
      merchHeading: fieldValue(byKey, "mission.merchHeading", d.mission.merchHeading),
      merchBody: fieldValue(byKey, "mission.merchBody", d.mission.merchBody),
    },
    blog: {
      title: fieldValue(byKey, "blog.title", d.blog.title),
      lede: fieldValue(byKey, "blog.lede", d.blog.lede),
      intro: fieldValue(byKey, "blog.intro", d.blog.intro),
      topicsHeading: fieldValue(byKey, "blog.topicsHeading", d.blog.topicsHeading),
      topics: blogTopics,
      emptyNote: fieldValue(byKey, "blog.emptyNote", d.blog.emptyNote),
    },
    contact: {
      intro: fieldValue(byKey, "contact.intro", d.contact.intro),
      responseExpectation: fieldValue(
        byKey,
        "contact.responseExpectation",
        d.contact.responseExpectation,
      ),
      helpHeading: fieldValue(byKey, "contact.helpHeading", d.contact.helpHeading),
      helpBullets: contactBullets,
      beforeContactLead: fieldValue(byKey, "contact.beforeContactLead", d.contact.beforeContactLead),
    },
    legalSupport: {
      supportEmail: fieldValue(byKey, "legal.supportEmail", d.legalSupport.supportEmail),
      supportResponseTime: fieldValue(
        byKey,
        "legal.supportResponseTime",
        d.legalSupport.supportResponseTime,
      ),
    },
    partnerPage,
    givePage,
    merchPage,
  };
}

function pickPageScalars(
  byKey: Map<string, ContentBlock>,
  pageKey: string,
  defaults: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...defaults };
  for (const key of Object.keys(defaults)) {
    if (
      key === "tiers" ||
      key === "milestones" ||
      key === "impactBullets" ||
      key === "oneTimeSuggestions"
    ) {
      continue;
    }
    if (typeof defaults[key] === "string") {
      out[key] = fieldValue(byKey, `${pageKey}.${key}`, String(defaults[key]));
    }
  }
  return out;
}

function resolvePartnerPage(byKey: Map<string, ContentBlock>, d: SiteCopy): SiteCopy["partnerPage"] {
  const base = pickPageScalars(byKey, "partner", d.partnerPage as unknown as Record<string, unknown>);
  const tiersBlock = byKey.get("partner.tiers");
  const msBlock = byKey.get("partner.milestones");
  const bulletsBlock = byKey.get("partner.impactBullets");

  const tiers =
    tiersBlock && !tiersBlock.visible
      ? []
      : tiersBlock
        ? visibleLines(tiersBlock.lines)
            .map((l) => ({
              amountLabel: String(l.metadata?.amountLabel ?? ""),
              name: l.text.trim(),
              description: String(l.metadata?.description ?? ""),
              giftNote: String(l.metadata?.giftNote ?? ""),
            }))
            .filter((t) => t.name)
        : d.partnerPage.tiers;

  const milestones =
    msBlock && !msBlock.visible
      ? []
      : msBlock
        ? visibleLines(msBlock.lines)
            .map((l) => ({
              when: String(l.metadata?.when ?? ""),
              title: l.text.trim(),
              description: String(l.metadata?.description ?? ""),
            }))
            .filter((m) => m.title)
        : d.partnerPage.milestones;

  const impactBullets =
    bulletsBlock && !bulletsBlock.visible
      ? []
      : bulletsBlock
        ? lineTexts(bulletsBlock)
        : d.partnerPage.impactBullets;

  return {
    ...(base as SiteCopy["partnerPage"]),
    tiers,
    milestones,
    impactBullets,
    waysToGetInvolved: d.partnerPage.waysToGetInvolved,
  };
}

function resolveGivePage(byKey: Map<string, ContentBlock>, d: SiteCopy): SiteCopy["givePage"] {
  const base = pickPageScalars(byKey, "give", d.givePage as unknown as Record<string, unknown>);
  const sugBlock = byKey.get("give.oneTimeSuggestions");
  const oneTimeSuggestions =
    sugBlock && !sugBlock.visible
      ? []
      : sugBlock
        ? lineTexts(sugBlock)
        : d.givePage.oneTimeSuggestions;
  return {
    ...(base as SiteCopy["givePage"]),
    oneTimeSuggestions,
  };
}

function resolveMerchPage(byKey: Map<string, ContentBlock>, d: SiteCopy): SiteCopy["merchPage"] {
  return pickPageScalars(byKey, "merch", d.merchPage as unknown as Record<string, unknown>) as SiteCopy["merchPage"];
}

export function getBlocksForAdmin(blocks: ContentBlock[]): ContentBlock[] {
  return sortBlocks(blocks);
}
