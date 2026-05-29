import { DEFAULT_SITE_COPY } from "@/data/site-copy-defaults";
import {
  ADVOCACY_TEAM_FINAL_CTA,
  ADVOCACY_TEAM_HERO,
  ADVOCACY_TEAM_INTRO,
  ADVOCACY_TEAM_MISSION,
  ADVOCACY_TEAM_ROLES,
} from "@/data/advocacy-team-content";
import {
  GET_INVOLVED_NAV,
  GIVE_NOW_NAV,
  STOREFRONT_FOOTER_NAV,
  STOREFRONT_HEADER_NAV,
} from "@/data/storefront-navigation";
import { DEFAULT_HOME_HERO_IMAGE_PATH } from "@/data/home-guided-default-sections";
import type { PageSection, SectionType } from "./types";
import { registryFor } from "./registry";

let order = 0;
function sec(
  pageKey: string,
  sectionKey: string,
  sectionType: SectionType,
  label: string,
  content: Record<string, unknown>,
  settings: Record<string, unknown> = {},
): PageSection {
  const reg = registryFor(sectionType);
  return {
    id: sectionKey,
    pageKey,
    sectionKey,
    sectionType,
    label,
    visible: true,
    sortOrder: order++,
    content: { ...reg.defaultContent, ...content },
    settings: { ...reg.defaultSettings, ...settings },
  };
}

function resetOrder() {
  order = 0;
}

function listItems(strings: string[]) {
  return strings.map((text, i) => ({
    id: `ln-${i}`,
    text,
    visible: true,
    sortOrder: i,
  }));
}

function cardItems(
  cards: { title: string; body: string; meta?: Record<string, unknown> }[],
) {
  return cards.map((c, i) => ({
    id: `card-${i}`,
    text: c.title,
    visible: true,
    sortOrder: i,
    metadata: { body: c.body, ...c.meta },
  }));
}

function timelineItems(
  rows: { when: string; title: string; description: string }[],
) {
  return rows.map((r, i) => ({
    id: `ms-${i}`,
    text: r.title,
    visible: true,
    sortOrder: i,
    metadata: { when: r.when, description: r.description },
  }));
}

export function defaultSectionsForPage(pageKey: string): PageSection[] {
  resetOrder();
  const c = DEFAULT_SITE_COPY;

  switch (pageKey) {
    case "home":
      return defaultHomeSections(c);
    case "about":
      return defaultAboutSections(c);
    case "mission":
      return defaultMissionSections(c);
    case "blog":
      return defaultBlogSections(c);
    case "community":
      return defaultCommunitySections(c);
    case "contact":
      return defaultContactSections(c);
    case "partner":
      return defaultPartnerSections(c);
    case "advocacy-team":
      return defaultAdvocacyTeamSections();
    case "give":
      return defaultGiveSections(c);
    case "merch":
      return defaultMerchSections(c);
    case "global":
      return defaultGlobalSections(c);
    default:
      return [];
  }
}

export function defaultAllPageSections(): PageSection[] {
  return [
    "global",
    "home",
    "about",
    "mission",
    "partner",
    "advocacy-team",
    "give",
    "merch",
    "blog",
    "community",
    "contact",
  ].flatMap((pageKey) => defaultSectionsForPage(pageKey));
}

function defaultHomeSections(c: typeof DEFAULT_SITE_COPY): PageSection[] {
  const g = c.homeGuided;
  const sections: PageSection[] = [
    sec("home", "hero", "hero", "Home hero", {
      headline: c.homeHero.headline,
      body: c.homeHero.body,
      imageUrl: g.heroImageUrl || DEFAULT_HOME_HERO_IMAGE_PATH,
      primaryCtaLabel: c.homeHero.primaryCtaLabel,
      primaryCtaUrl: "/partner",
      secondaryCtaLabel: g.heroLearnMoreLabel,
      secondaryCtaUrl: "/mission",
      tertiaryCtaLabel: "Get Involved",
      tertiaryCtaUrl: "/partner",
    }),
  ];

  g.sections.forEach((row, i) => {
    sections.push(
      sec(
        "home",
        `guided-${row.id}`,
        "image_text_split",
        `Guided: ${row.title}`,
        {
          headline: row.title,
          body: row.body,
          ctaLabel: row.ctaLabel,
          ctaUrl: row.href,
          imageUrl: row.imageUrl,
        },
        { imagePosition: i % 2 === 0 ? "right" : "left", rowId: row.id },
      ),
    );
    if (row.id === "mission") {
      sections.push(
        sec("home", "scroll-break", "text_section", "Scroll break", {
          body: g.scrollBreakBody,
        }),
      );
    }
  });

  sections.push(
    sec("home", "closing", "cta", "Closing CTA", {
      body: g.closingBody,
      primaryCtaLabel: "Partner",
      primaryCtaUrl: "/partner",
      secondaryCtaLabel: "Give",
      secondaryCtaUrl: "/give",
    }),
    sec("home", "pathways", "card_grid", "Pathway cards", {
      headline: c.home.featuredTitle,
      intro: c.home.featuredEmpty,
      cards: cardItems([
        { title: c.home.whoTitle, body: c.home.whoBody, meta: { cta: c.home.whoCta, href: "/about" } },
        { title: c.home.whyTitle, body: c.home.whyBody, meta: { cta: c.home.whyCta, href: "/mission" } },
        { title: c.home.merchTitle, body: c.home.merchBlurb, meta: { cta: c.home.viewAllMerchLabel, href: "/merch" } },
      ]),
    }),
  );
  return sections;
}

function defaultAboutSections(c: typeof DEFAULT_SITE_COPY): PageSection[] {
  return [
    sec("about", "header", "text_section", "Page header", {
      headline: c.about.title,
      body: c.about.lede,
    }),
    ...c.about.sections.map((s, i) =>
      sec(`about`, `section-${i}`, "text_section", s.heading, {
        headline: s.heading,
        body: s.body,
      }),
    ),
    sec("about", "footer-nav", "cta", "Page links", {
      primaryCtaLabel: "Become a partner",
      primaryCtaUrl: "/partner",
      secondaryCtaLabel: "Give",
      secondaryCtaUrl: "/give",
    }),
  ];
}

function defaultMissionSections(c: typeof DEFAULT_SITE_COPY): PageSection[] {
  return [
    sec("mission", "header", "text_section", "Page header", {
      headline: c.mission.title,
      body: c.mission.lede,
    }),
    sec("mission", "focus", "text_section", "Focus list", {
      headline: c.mission.focusHeading,
      bullets: listItems(c.mission.bullets),
    }),
    sec("mission", "merch", "text_section", "Merch note", {
      headline: c.mission.merchHeading,
      body: c.mission.merchBody,
    }),
  ];
}

function defaultCommunitySections(c: typeof DEFAULT_SITE_COPY): PageSection[] {
  const intro =
    "A private space for partners and friends — share encouragement, prayer, and updates as we serve together on mission.";
  return [
    sec("community", "hero", "hero", "Mission Hub hero", {
      eyebrow: "Mission Hub",
      headline: "Our family space",
      body: intro,
      primaryCtaLabel: "Join Mission Hub",
      primaryCtaUrl: "/community/join",
      secondaryCtaLabel: "Sign in",
      secondaryCtaUrl: "/community/login",
    }),
    sec("community", "featured", "text_section", "Featured highlights", {
      headline: "Stay connected",
      body: "Browse spaces for prayer, updates, and conversation. Your family in Christ is here.",
    }),
    sec("community", "seo", "text_section", "SEO & sharing", {
      headline: "Mission Hub",
      body: `Community feed and spaces for ${c.site.name} — partners, prayer, and ministry updates.`,
    }),
  ];
}

function defaultBlogSections(c: typeof DEFAULT_SITE_COPY): PageSection[] {
  return [
    sec("blog", "header", "text_section", "Page header", {
      headline: c.blog.title,
      subheadline: c.blog.lede,
      body: c.blog.intro,
    }),
    sec("blog", "topics", "featured_posts", "Topics", {
      headline: c.blog.topicsHeading,
      body: c.blog.emptyNote,
      topics: listItems(c.blog.topics),
    }),
  ];
}

function defaultContactSections(c: typeof DEFAULT_SITE_COPY): PageSection[] {
  return [
    sec("contact", "header", "text_section", "Page header", {
      body: c.contact.intro,
      subheadline: c.contact.responseExpectation,
    }),
    sec("contact", "help", "text_section", "How we can help", {
      headline: c.contact.helpHeading,
      bullets: listItems(c.contact.helpBullets),
    }),
    sec("contact", "lead", "text_section", "Before contact", {
      body: c.contact.beforeContactLead,
    }),
  ];
}

function defaultPartnerSections(c: typeof DEFAULT_SITE_COPY): PageSection[] {
  const p = c.partnerPage;
  return [
    sec("partner", "hero", "hero", "Hero", {
      eyebrow: p.heroEyebrow,
      headline: p.heroTitle,
      body: p.heroBody,
      primaryCtaLabel: p.primaryCtaLabel,
      primaryCtaUrl: "/partner",
      secondaryCtaLabel: p.secondaryCtaLabel,
      secondaryCtaUrl: "/partner#ways-to-get-involved",
    }),
    sec("partner", "why", "text_section", "Why partner", {
      headline: p.whyHeading,
      body: `${p.whyBodyParagraph1}\n\n${p.whyBodyParagraph2}`,
    }),
    sec("partner", "ways-to-get-involved", "card_grid", "Ways to Get Involved", {
      headline: p.waysToGetInvolvedHeading,
      intro: p.waysToGetInvolvedIntro,
      cards: cardItems(
        p.waysToGetInvolved.map((w) => ({
          title: w.title,
          body: w.description,
          meta: { cta: w.ctaLabel, href: w.href },
        })),
      ),
    }),
    sec("partner", "tiers", "card_grid", "Partner tiers", {
      headline: p.tiersHeading,
      intro: p.tiersIntro,
      cards: cardItems(
        p.tiers.map((t) => ({
          title: t.name,
          body: t.description,
          meta: { amountLabel: t.amountLabel, giftNote: t.giftNote },
        })),
      ),
    }),
    sec("partner", "thank-you", "text_section", "Thank you", {
      headline: p.thankYouHeading,
      body: `${p.thankYouParagraph1}\n\n${p.thankYouParagraph2}`,
    }),
    sec("partner", "milestones", "timeline", "Milestones", {
      headline: p.milestonesHeading,
      intro: p.milestonesIntro,
      items: timelineItems(p.milestones),
    }),
    sec("partner", "impact", "text_section", "Impact", {
      headline: p.impactHeading,
      body: p.impactIntro,
      bullets: listItems(p.impactBullets),
    }),
    sec("partner", "compliance", "quote", "Compliance", {
      quote: p.complianceBoxBody,
      attribution: p.complianceBoxTitle,
    }),
    sec("partner", "final-cta", "cta", "Final CTA", {
      headline: p.finalHeading,
      body: p.finalBody,
      primaryCtaLabel: p.finalPrimaryCtaLabel,
      primaryCtaUrl: "/partner",
      secondaryCtaLabel: p.finalSecondaryCtaLabel,
      secondaryCtaUrl: "/advocacy-team",
    }),
  ];
}

function defaultAdvocacyTeamSections(): PageSection[] {
  return [
    sec("advocacy-team", "hero", "hero", "Hero", {
      eyebrow: ADVOCACY_TEAM_HERO.eyebrow,
      headline: ADVOCACY_TEAM_HERO.title,
      body: ADVOCACY_TEAM_HERO.subtitle,
      primaryCtaLabel: ADVOCACY_TEAM_HERO.primaryCtaLabel,
      primaryCtaUrl: "/contact",
      secondaryCtaLabel: ADVOCACY_TEAM_HERO.secondaryCtaLabel,
      secondaryCtaUrl: "#advocacy-team-resources",
    }),
    sec("advocacy-team", "intro", "text_section", "What is an Advocacy Team Member?", {
      headline: ADVOCACY_TEAM_INTRO.heading,
      body: ADVOCACY_TEAM_INTRO.paragraphs.join("\n\n"),
    }),
    sec("advocacy-team", "mission", "text_section", "Our mission", {
      headline: ADVOCACY_TEAM_MISSION.heading,
      body: ADVOCACY_TEAM_MISSION.statement,
    }),
    sec("advocacy-team", "roles", "card_grid", "Roles", {
      headline: "What Advocacy Team Members do",
      intro: "Pray, advocate, connect, and mobilize — four rhythms of serving alongside the mission.",
      cards: cardItems(
        ADVOCACY_TEAM_ROLES.map((role) => ({
          title: role.title,
          body: `${role.summary}\n\n${role.bullets.map((b) => `• ${b}`).join("\n")}`,
        })),
      ),
    }),
    sec("advocacy-team", "final-cta", "cta", "Final CTA", {
      headline: ADVOCACY_TEAM_FINAL_CTA.heading,
      body: ADVOCACY_TEAM_FINAL_CTA.body,
      primaryCtaLabel: ADVOCACY_TEAM_FINAL_CTA.buttonLabel,
      primaryCtaUrl: "/contact",
    }),
  ];
}

function defaultGiveSections(c: typeof DEFAULT_SITE_COPY): PageSection[] {
  const p = c.givePage;
  return [
    sec("give", "header", "text_section", "Header", {
      eyebrow: p.kicker,
      headline: p.title,
      body: p.intro,
    }),
    sec("give", "monthly", "text_section", "Monthly giving", {
      headline: p.monthlySectionHeading,
      body: p.monthlySectionBody,
      primaryCtaLabel: p.startMonthlyCta,
      secondaryCtaLabel: p.learnPartnerCta,
    }),
    sec("give", "levels", "text_section", "Suggested levels", {
      headline: p.suggestedLevelsHeading,
      body: p.suggestedLevelsIntro,
    }),
    sec("give", "onetime", "text_section", "One-time gift", {
      headline: p.oneTimeHeading,
      body: p.oneTimeBody,
      bullets: listItems(p.oneTimeSuggestions),
    }),
    sec("give", "thank-you", "text_section", "Thank you", {
      headline: p.thankYouHeading,
      body: `${p.thankYouBeforePartnerLink} ${p.thankYouPartnerLinkLabel} ${p.thankYouAfterPartnerLink}`,
    }),
    sec("give", "compliance", "quote", "Compliance", {
      quote: p.complianceBody,
      attribution: p.complianceHeading,
    }),
  ];
}

function defaultMerchSections(c: typeof DEFAULT_SITE_COPY): PageSection[] {
  const p = c.merchPage;
  return [
    sec("merch", "header", "text_section", "Header", {
      eyebrow: p.kicker,
      headline: p.title,
      body: p.intro,
    }),
    sec("merch", "thank-you", "text_section", "Thank you", {
      headline: p.thankYouHeading,
      body: `${p.thankYouBeforePartnerLink} ${p.thankYouPartnerLinkLabel}`,
    }),
    sec("merch", "collection", "text_section", "Collection", {
      headline: p.collectionHeading,
      body: p.collectionBody,
    }),
    sec("merch", "cta", "cta", "CTAs", {
      primaryCtaLabel: p.ctaPartner,
      primaryCtaUrl: "/partner",
      secondaryCtaLabel: p.ctaGive,
      secondaryCtaUrl: "/give",
    }),
  ];
}

function defaultGlobalSections(c: typeof DEFAULT_SITE_COPY): PageSection[] {
  const getInvolvedLabel =
    c.navLinks.find((l) => l.href === GET_INVOLVED_NAV.labelHref)?.label ?? GET_INVOLVED_NAV.label;

  const labelFor = (href: string, fallback: string) =>
    c.navLinks.find((l) => l.href === href)?.label ?? fallback;

  const headerLabels = [
    ...STOREFRONT_HEADER_NAV.slice(0, 3).map((item) => `${labelFor(item.href, item.label)} → ${item.href}`),
    `${getInvolvedLabel} (dropdown) → /partner, /advocacy-team`,
    ...STOREFRONT_HEADER_NAV.slice(3).map((item) => `${labelFor(item.href, item.label)} → ${item.href}`),
  ];

  return [
    sec("global", "site-meta", "text_section", "Site metadata", {
      headline: c.site.name,
      subheadline: c.site.tagline,
      body: c.site.description,
    }),
    sec("global", "header-nav", "text_section", "Header navigation", {
      headline: "Storefront header",
      body:
        "Desktop and tablet (768px and up): top-level links plus a Get Involved dropdown and Give Now button. " +
        "Mobile: logo, Give Now, and a hamburger menu with the same links. Merch is footer-only (not in the header).",
      bullets: listItems(headerLabels),
    }),
    sec("global", "get-involved-menu", "card_grid", "Get Involved dropdown", {
      headline: getInvolvedLabel,
      intro: "Menu items when visitors open Get Involved in the header.",
      cards: cardItems(
        GET_INVOLVED_NAV.items.map((item) => ({
          title: item.label,
          body: item.description ?? "",
          meta: { href: item.href },
        })),
      ),
    }),
    sec("global", "give-now-button", "text_section", "Give Now button", {
      headline: GIVE_NOW_NAV.label,
      body: `Prominent header button linking to ${GIVE_NOW_NAV.href}.`,
      primaryCtaLabel: GIVE_NOW_NAV.label,
      primaryCtaUrl: GIVE_NOW_NAV.href,
    }),
    sec("global", "footer-nav", "text_section", "Footer navigation", {
      headline: "Footer links",
      body: "All footer nav labels and paths (includes Give, Partner, Advocacy Team, and Merch).",
      bullets: listItems(STOREFRONT_FOOTER_NAV.map((l) => `${l.label} → ${l.href}`)),
    }),
    sec("global", "footer", "text_section", "Footer blurb", {
      body: c.footer.blurb,
    }),
    sec("global", "legal", "text_section", "Support contact", {
      headline: c.legalSupport.supportEmail,
      body: c.legalSupport.supportResponseTime,
    }),
  ];
}
