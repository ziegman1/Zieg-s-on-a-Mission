import type { SiteCopy } from "@/data/site-copy-defaults";
import type { ContentBlock, ContentLine, BlockType } from "./types";
import { appendNavigationExtraBlocks } from "./navigation-extras";
import { newLineId } from "./utils";

type BlockDraft = Omit<ContentBlock, "id" | "sortOrder"> & { sortOrder?: number };

function block(
  order: { n: number },
  draft: BlockDraft,
): ContentBlock {
  return {
    id: draft.blockKey,
    sortOrder: draft.sortOrder ?? order.n++,
    ...draft,
    lines: draft.lines ?? [],
    metadata: draft.metadata ?? {},
  };
}

function linesFromStrings(items: string[], metaKey?: string): ContentLine[] {
  return items.map((text, i) => ({
    id: newLineId(),
    text,
    visible: true,
    sortOrder: i,
    metadata: metaKey ? { [metaKey]: text } : undefined,
  }));
}

function scalar(
  order: { n: number },
  pageKey: string,
  sectionKey: string,
  blockKey: string,
  label: string,
  value: string,
  blockType: BlockType = "text",
): ContentBlock {
  return block(order, {
    pageKey,
    sectionKey,
    blockKey,
    blockType,
    label,
    value,
    lines: [],
    visible: true,
    metadata: {},
  });
}

/** Build default blocks from a resolved SiteCopy object (defaults or merged legacy). */
export function siteCopyToBlocks(copy: SiteCopy): ContentBlock[] {
  const order = { n: 0 };
  const blocks: ContentBlock[] = [];

  blocks.push(
    scalar(order, "global", "site", "site.name", "Site name", copy.site.name),
    scalar(order, "global", "site", "site.tagline", "Tagline", copy.site.tagline),
    scalar(order, "global", "site", "site.description", "Meta description", copy.site.description, "textarea"),
    scalar(order, "global", "footer", "footer.blurb", "Footer blurb", copy.footer.blurb, "textarea"),
    scalar(order, "global", "legal", "legal.supportEmail", "Support email", copy.legalSupport.supportEmail),
    scalar(
      order,
      "global",
      "legal",
      "legal.supportResponseTime",
      "Support response time",
      copy.legalSupport.supportResponseTime,
    ),
  );

  copy.navLinks.forEach((link, i) => {
    blocks.push(
      block(order, {
        pageKey: "global",
        sectionKey: "navigation",
        blockKey: `nav.link.${i}`,
        blockType: "nav_link",
        label: `Nav label (${link.href})`,
        value: link.label,
        lines: [],
        visible: true,
        metadata: { href: link.href, index: i },
      }),
    );
  });

  appendNavigationExtraBlocks(order, blocks);

  blocks.push(
    scalar(order, "home", "hero", "homeHero.headline", "Hero headline", copy.homeHero.headline, "heading"),
    scalar(order, "home", "hero", "homeHero.subheadline", "Hero subheadline", copy.homeHero.subheadline, "heading"),
    scalar(order, "home", "hero", "homeHero.body", "Hero body", copy.homeHero.body, "textarea"),
    scalar(order, "home", "hero", "homeHero.primaryCtaLabel", "Primary CTA label", copy.homeHero.primaryCtaLabel, "cta"),
    scalar(order, "home", "hero", "homeHero.secondaryCtaLabel", "Secondary CTA label", copy.homeHero.secondaryCtaLabel, "cta"),
    scalar(order, "home", "hero", "homeGuided.heroImageUrl", "Hero background image URL", copy.homeGuided.heroImageUrl, "image"),
    scalar(order, "home", "hero", "homeGuided.heroLearnMoreLabel", "Learn more button label", copy.homeGuided.heroLearnMoreLabel, "cta"),
    scalar(order, "home", "guided", "homeGuided.scrollBreakBody", "Scroll break text", copy.homeGuided.scrollBreakBody, "textarea"),
    scalar(order, "home", "guided", "homeGuided.closingBody", "Closing paragraph", copy.homeGuided.closingBody, "textarea"),
  );

  copy.homeGuided.sections.forEach((sec, i) => {
    blocks.push(
      block(order, {
        pageKey: "home",
        sectionKey: "guided_sections",
        blockKey: `homeGuided.section.${sec.id}`,
        blockType: "structured_list",
        label: `Guided section: ${sec.title}`,
        value: sec.title,
        lines: [
          {
            id: `${sec.id}-body`,
            text: sec.body,
            visible: true,
            sortOrder: 0,
            metadata: { field: "body" },
          },
          {
            id: `${sec.id}-cta`,
            text: sec.ctaLabel,
            visible: true,
            sortOrder: 1,
            metadata: { field: "ctaLabel" },
          },
        ],
        visible: true,
        metadata: { id: sec.id, href: sec.href, imageUrl: sec.imageUrl, index: i },
      }),
    );
  });

  const homeScalars: [string, string, keyof SiteCopy["home"]][] = [
    ["home.whoTitle", "Who we are — title", "whoTitle"],
    ["home.whoBody", "Who we are — body", "whoBody"],
    ["home.whoCta", "Who we are — link text", "whoCta"],
    ["home.whyTitle", "Why partnership — title", "whyTitle"],
    ["home.whyBody", "Why partnership — body", "whyBody"],
    ["home.whyCta", "Why partnership — link text", "whyCta"],
    ["home.merchTitle", "Gifts & merch — title", "merchTitle"],
    ["home.merchBlurb", "Gifts & merch — blurb", "merchBlurb"],
    ["home.featuredTitle", "Support pathways — title", "featuredTitle"],
    ["home.featuredEmpty", "Support pathways — body", "featuredEmpty"],
    ["home.viewAllMerchLabel", "Explore merch button", "viewAllMerchLabel"],
  ];
  for (const [key, label, field] of homeScalars) {
    const val = copy.home[field];
    blocks.push(
      scalar(
        order,
        "home",
        "pathways",
        key,
        label,
        val,
        key.includes("Body") || key.includes("Blurb") || key.includes("featuredEmpty") ? "textarea" : "text",
      ),
    );
  }

  blocks.push(
    scalar(order, "about", "page", "about.title", "Page title", copy.about.title, "heading"),
    scalar(order, "about", "page", "about.lede", "Intro (lede)", copy.about.lede, "textarea"),
    scalar(order, "about", "hero", "about.heroEyebrow", "Hero eyebrow", copy.about.heroEyebrow, "heading"),
    scalar(order, "about", "hero", "about.heroHeadline", "Hero headline", copy.about.heroHeadline, "heading"),
    scalar(
      order,
      "about",
      "hero",
      "about.heroSubheadline",
      "Hero subheadline",
      copy.about.heroSubheadline,
      "heading",
    ),
    scalar(order, "about", "hero", "about.heroBody", "Hero body", copy.about.heroBody, "textarea"),
    block(order, {
      pageKey: "about",
      sectionKey: "sections",
      blockKey: "about.sections",
      blockType: "structured_list",
      label: "About sections",
      value: "",
      lines: copy.about.sections.map((s, i) => ({
        id: `about-sec-${i}`,
        text: s.heading,
        visible: true,
        sortOrder: i,
        metadata: { body: s.body },
      })),
      visible: true,
      metadata: {},
    }),
  );

  blocks.push(
    scalar(order, "mission", "page", "mission.title", "Page title", copy.mission.title, "heading"),
    scalar(order, "mission", "page", "mission.lede", "Lede", copy.mission.lede, "textarea"),
    scalar(order, "mission", "page", "mission.focusHeading", "Focus list heading", copy.mission.focusHeading),
    block(order, {
      pageKey: "mission",
      sectionKey: "focus",
      blockKey: "mission.bullets",
      blockType: "bullet_list",
      label: "Focus bullets",
      value: "",
      lines: linesFromStrings(copy.mission.bullets),
      visible: true,
      metadata: {},
    }),
    scalar(order, "mission", "page", "mission.merchHeading", "Merch block heading", copy.mission.merchHeading),
    scalar(order, "mission", "page", "mission.merchBody", "Merch block body", copy.mission.merchBody, "textarea"),
  );

  blocks.push(
    scalar(order, "blog", "page", "blog.title", "Page title", copy.blog.title, "heading"),
    scalar(order, "blog", "page", "blog.lede", "Lede", copy.blog.lede, "textarea"),
    scalar(order, "blog", "page", "blog.intro", "Intro", copy.blog.intro, "textarea"),
    scalar(order, "blog", "page", "blog.topicsHeading", "Topics heading", copy.blog.topicsHeading),
    block(order, {
      pageKey: "blog",
      sectionKey: "topics",
      blockKey: "blog.topics",
      blockType: "bullet_list",
      label: "Topics list",
      value: "",
      lines: linesFromStrings(copy.blog.topics),
      visible: true,
      metadata: {},
    }),
    scalar(order, "blog", "page", "blog.emptyNote", "Empty state note", copy.blog.emptyNote, "textarea"),
  );

  blocks.push(
    scalar(order, "contact", "page", "contact.intro", "Intro", copy.contact.intro, "textarea"),
    scalar(order, "contact", "page", "contact.responseExpectation", "Response expectation", copy.contact.responseExpectation),
    scalar(order, "contact", "page", "contact.helpHeading", "Help heading", copy.contact.helpHeading),
    block(order, {
      pageKey: "contact",
      sectionKey: "help",
      blockKey: "contact.helpBullets",
      blockType: "bullet_list",
      label: "Help bullets",
      value: "",
      lines: linesFromStrings(copy.contact.helpBullets),
      visible: true,
      metadata: {},
    }),
    scalar(order, "contact", "page", "contact.beforeContactLead", "Before contact lead-in", copy.contact.beforeContactLead),
  );

  encodeMarketingPage(order, blocks, "partner", copy.partnerPage);
  encodeMarketingPage(order, blocks, "give", copy.givePage);
  encodeMarketingPage(order, blocks, "merch", copy.merchPage);

  return blocks;
}

function encodeMarketingPage(
  order: { n: number },
  blocks: ContentBlock[],
  pageKey: "partner" | "give" | "merch",
  page: Record<string, unknown>,
) {
  const textareaKeys = new Set([
    "heroBody",
    "whyBodyParagraph1",
    "whyBodyParagraph2",
    "tiersIntro",
    "thankYouParagraph1",
    "thankYouParagraph2",
    "milestonesIntro",
    "impactIntro",
    "complianceBoxBody",
    "intro",
    "monthlySectionBody",
    "oneTimeBody",
    "thankYouBeforePartnerLink",
    "thankYouAfterPartnerLink",
    "complianceBody",
    "collectionBody",
  ]);

  for (const [key, val] of Object.entries(page)) {
    if (key === "tiers" && Array.isArray(val)) {
      blocks.push(
        block(order, {
          pageKey,
          sectionKey: "tiers",
          blockKey: `${pageKey}.tiers`,
          blockType: "structured_list",
          label: "Partner tiers",
          value: "",
          lines: (val as { amountLabel: string; name: string; description: string; giftNote: string }[]).map(
            (t, i) => ({
              id: `tier-${i}`,
              text: t.name,
              visible: true,
              sortOrder: i,
              metadata: {
                amountLabel: t.amountLabel,
                description: t.description,
                giftNote: t.giftNote,
              },
            }),
          ),
          visible: true,
          metadata: {},
        }),
      );
      continue;
    }
    if (key === "milestones" && Array.isArray(val)) {
      blocks.push(
        block(order, {
          pageKey,
          sectionKey: "milestones",
          blockKey: `${pageKey}.milestones`,
          blockType: "structured_list",
          label: "Milestones",
          value: "",
          lines: (val as { when: string; title: string; description: string }[]).map((m, i) => ({
            id: `ms-${i}`,
            text: m.title,
            visible: true,
            sortOrder: i,
            metadata: { when: m.when, description: m.description },
          })),
          visible: true,
          metadata: {},
        }),
      );
      continue;
    }
    if (key === "impactBullets" || key === "oneTimeSuggestions") {
      blocks.push(
        block(order, {
          pageKey,
          sectionKey: key.includes("impact") ? "impact" : "suggestions",
          blockKey: `${pageKey}.${key}`,
          blockType: "bullet_list",
          label: key === "impactBullets" ? "Impact bullets" : "One-time suggestions",
          value: "",
          lines: linesFromStrings(val as string[]),
          visible: true,
          metadata: {},
        }),
      );
      continue;
    }
    if (typeof val !== "string") continue;
    const blockType = textareaKeys.has(key) ? "textarea" : key.includes("Cta") || key.includes("cta") ? "cta" : "text";
    blocks.push(
      scalar(order, pageKey, "content", `${pageKey}.${key}`, humanizeKey(key), val, blockType),
    );
  }
}

function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}
