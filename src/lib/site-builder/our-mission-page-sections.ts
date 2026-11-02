/**
 * Our Mission Site Builder integration.
 *
 * Editable narrative lives in Site Builder sections (defaults from our-mission-content).
 * Protected ministry framework (tracker, definitions, avenues, measurement) is always
 * rendered from the shared content module / live counts — never authored as CMS copy.
 */

import {
  OUR_MISSION_BEYOND,
  OUR_MISSION_CTAS,
  OUR_MISSION_HERO,
  OUR_MISSION_INVITATION,
} from "@/data/our-mission-content";
import type { PageSection, SectionType } from "./types";
import { registryFor } from "./registry";

export const OUR_MISSION_PAGE_KEY = "our-mission" as const;

export const OUR_MISSION_EDITABLE_SECTION_KEYS = [
  "hero",
  "beyond",
  "invitation",
] as const;

export const OUR_MISSION_PROTECTED_SECTION_KEYS = [
  "tracker",
  "functions",
  "avenues",
  "measurement",
] as const;

export type OurMissionEditableSectionKey =
  (typeof OUR_MISSION_EDITABLE_SECTION_KEYS)[number];

export type OurMissionProtectedSectionKey =
  (typeof OUR_MISSION_PROTECTED_SECTION_KEYS)[number];

export const OUR_MISSION_FRAMEWORK_PROTECTED_SETTING = "ministryFrameworkProtected";

export type OurMissionNarrative = {
  hero: {
    title: string;
    supporting: string;
    paragraphs: string[];
  };
  beyond: {
    title: string;
    paragraphs: string[];
  };
  invitation: {
    title: string;
    paragraphs: string[];
  };
  ctas: Array<{ href: string; label: string }>;
};

function sec(
  sectionKey: string,
  sectionType: SectionType,
  label: string,
  content: Record<string, unknown>,
  settings: Record<string, unknown> = {},
): PageSection {
  const reg = registryFor(sectionType);
  return {
    id: sectionKey,
    pageKey: OUR_MISSION_PAGE_KEY,
    sectionKey,
    sectionType,
    label,
    visible: true,
    sortOrder: 0,
    content: { ...reg.defaultContent, ...content },
    settings: { ...reg.defaultSettings, ...settings },
  };
}

export function isOurMissionProtectedSection(section: PageSection): boolean {
  return (
    section.settings?.[OUR_MISSION_FRAMEWORK_PROTECTED_SETTING] === true ||
    (OUR_MISSION_PROTECTED_SECTION_KEYS as readonly string[]).includes(section.sectionKey)
  );
}

export function isOurMissionEditableSectionKey(key: string): boolean {
  return (OUR_MISSION_EDITABLE_SECTION_KEYS as readonly string[]).includes(key);
}

export function isOurMissionFrameworkSectionKey(key: string): boolean {
  return (
    isOurMissionEditableSectionKey(key) ||
    (OUR_MISSION_PROTECTED_SECTION_KEYS as readonly string[]).includes(key)
  );
}

/** Editable defaults only — never include protected framework as CMS rows. */
export function defaultOurMissionEditableSections(): PageSection[] {
  return [
    sec("hero", "hero", "Hero & ministry vision", {
      headline: OUR_MISSION_HERO.title,
      subheadline: OUR_MISSION_HERO.supporting,
      body: OUR_MISSION_HERO.paragraphs.join("\n\n"),
    }),
    sec("beyond", "text_section", "Continued coaching", {
      headline: OUR_MISSION_BEYOND.title,
      body: OUR_MISSION_BEYOND.paragraphs.join("\n\n"),
    }),
    sec("invitation", "cta", "Invitation & CTAs", {
      headline: OUR_MISSION_INVITATION.title,
      body: OUR_MISSION_INVITATION.paragraphs.join("\n\n"),
      primaryCtaLabel: OUR_MISSION_CTAS[0]?.label ?? "Partner With Us",
      primaryCtaUrl: OUR_MISSION_CTAS[0]?.href ?? "/partner",
      secondaryCtaLabel: OUR_MISSION_CTAS[1]?.label ?? "Explore Opportunities to Serve",
      secondaryCtaUrl: OUR_MISSION_CTAS[1]?.href ?? "/contact",
    }),
  ].map((section, index) => ({ ...section, sortOrder: index }));
}

/** Virtual protected sections for Site Builder preview / selection only. */
export function ourMissionProtectedPreviewSections(): PageSection[] {
  const protectedSettings = { [OUR_MISSION_FRAMEWORK_PROTECTED_SETTING]: true };
  return [
    sec(
      "tracker",
      "text_section",
      "Live Ministry Impact Tracker",
      {
        headline: "The Progress So Far",
        body: "Live totals from ministry records. Not editable here.",
      },
      protectedSettings,
    ),
    sec(
      "functions",
      "text_section",
      "Mobilize, Train & Equip, Send",
      {
        headline: "What Does It Mean to Mobilize, Train & Send?",
        body: "Authoritative ministry definitions from the Ministry Impact Framework.",
      },
      protectedSettings,
    ),
    sec(
      "avenues",
      "text_section",
      "Three ministry avenues",
      {
        headline: "Three Avenues. One Mission.",
        body: "Avenue descriptions and milestone qualifications stay in code.",
      },
      protectedSettings,
    ),
    sec(
      "measurement",
      "text_section",
      "How We Measure Progress",
      {
        headline: "How We Measure Our Progress",
        body: "Official milestone methodology. Not editable here.",
      },
      protectedSettings,
    ),
  ];
}

/**
 * Merge stored editable/editorial sections with virtual protected framework sections
 * in the public page order for the admin preview.
 */
export function mergeOurMissionAdminSections(stored: PageSection[]): PageSection[] {
  const byKey = new Map(stored.map((section) => [section.sectionKey, section]));
  const editableDefaults = defaultOurMissionEditableSections();
  const protectedDefaults = ourMissionProtectedPreviewSections();

  const hero =
    byKey.get("hero") ??
    editableDefaults.find((section) => section.sectionKey === "hero")!;
  const beyond =
    byKey.get("beyond") ??
    editableDefaults.find((section) => section.sectionKey === "beyond")!;
  const invitation =
    byKey.get("invitation") ??
    editableDefaults.find((section) => section.sectionKey === "invitation")!;

  const tracker = protectedDefaults.find((section) => section.sectionKey === "tracker")!;
  const functions = protectedDefaults.find((section) => section.sectionKey === "functions")!;
  const avenues = protectedDefaults.find((section) => section.sectionKey === "avenues")!;
  const measurement = protectedDefaults.find(
    (section) => section.sectionKey === "measurement",
  )!;

  const editorial = stored.filter(
    (section) => !isOurMissionFrameworkSectionKey(section.sectionKey),
  );

  return [hero, tracker, functions, avenues, beyond, measurement, ...editorial, invitation].map(
    (section, index) => ({
      ...section,
      pageKey: OUR_MISSION_PAGE_KEY,
      sortOrder: index,
      settings: isOurMissionProtectedSection(section)
        ? { ...section.settings, [OUR_MISSION_FRAMEWORK_PROTECTED_SETTING]: true }
        : section.settings,
    }),
  );
}

/** Remove virtual protected sections before persisting. */
export function stripOurMissionProtectedSections(sections: PageSection[]): PageSection[] {
  return sections
    .filter((section) => !isOurMissionProtectedSection(section))
    .map((section, index) => ({ ...section, sortOrder: index }));
}

function paragraphsFromBody(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function contentString(section: PageSection | undefined, key: string): string {
  const value = section?.content?.[key];
  return typeof value === "string" ? value.trim() : "";
}

/** Resolve public narrative from stored sections, falling back to authoritative defaults. */
export function resolveOurMissionNarrative(sections: PageSection[]): OurMissionNarrative {
  const byKey = new Map(sections.map((section) => [section.sectionKey, section]));
  const hero = byKey.get("hero");
  const beyond = byKey.get("beyond");
  const invitation = byKey.get("invitation");

  const heroBody = contentString(hero, "body");
  const beyondBody = contentString(beyond, "body");
  const invitationBody = contentString(invitation, "body");

  const primaryLabel = contentString(invitation, "primaryCtaLabel");
  const primaryUrl = contentString(invitation, "primaryCtaUrl");
  const secondaryLabel = contentString(invitation, "secondaryCtaLabel");
  const secondaryUrl = contentString(invitation, "secondaryCtaUrl");

  return {
    hero: {
      title: contentString(hero, "headline") || OUR_MISSION_HERO.title,
      supporting: contentString(hero, "subheadline") || OUR_MISSION_HERO.supporting,
      paragraphs: heroBody ? paragraphsFromBody(heroBody) : [...OUR_MISSION_HERO.paragraphs],
    },
    beyond: {
      title: contentString(beyond, "headline") || OUR_MISSION_BEYOND.title,
      paragraphs: beyondBody
        ? paragraphsFromBody(beyondBody)
        : [...OUR_MISSION_BEYOND.paragraphs],
    },
    invitation: {
      title: contentString(invitation, "headline") || OUR_MISSION_INVITATION.title,
      paragraphs: invitationBody
        ? paragraphsFromBody(invitationBody)
        : [...OUR_MISSION_INVITATION.paragraphs],
    },
    ctas: [
      {
        label: primaryLabel || OUR_MISSION_CTAS[0]!.label,
        href: primaryUrl || OUR_MISSION_CTAS[0]!.href,
      },
      {
        label: secondaryLabel || OUR_MISSION_CTAS[1]!.label,
        href: secondaryUrl || OUR_MISSION_CTAS[1]!.href,
      },
    ],
  };
}

/** Supplemental Site Builder sections (stories, etc.) — not the framework. */
export function partitionOurMissionEditorialSections(sections: PageSection[]): PageSection[] {
  return sections.filter(
    (section) =>
      section.visible &&
      !isOurMissionFrameworkSectionKey(section.sectionKey) &&
      !isOurMissionProtectedSection(section),
  );
}
