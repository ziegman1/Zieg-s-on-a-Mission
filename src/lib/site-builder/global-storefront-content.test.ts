import { describe, expect, it, vi, beforeEach } from "vitest";
import { DEFAULT_SITE_COPY } from "@/data/site-copy-defaults";
import { GIVE_NOW_NAV, STOREFRONT_FOOTER_NAV } from "@/data/storefront-navigation";
import {
  FOOTER_BLURB_LEGACY_KEY,
  FOOTER_BLURB_SITE_BUILDER_KEY,
  parseNavBulletLine,
  resolveFooterBlurb,
  resolveStorefrontShellContent,
} from "./global-storefront-content";

vi.mock("@/lib/site-builder/sections-db", () => ({
  pageHasCustomSections: vi.fn(),
  loadPageSections: vi.fn(),
}));

vi.mock("@/lib/site-copy", () => ({
  getSiteCopy: vi.fn(),
  getSiteCopyBlocksForAdmin: vi.fn(),
}));

vi.mock("@/lib/site-copy-blocks/navigation-extras", () => ({
  resolveNavigationExtras: vi.fn(),
}));

import { loadPageSections, pageHasCustomSections } from "@/lib/site-builder/sections-db";
import { getSiteCopy, getSiteCopyBlocksForAdmin } from "@/lib/site-copy";
import { resolveNavigationExtras } from "@/lib/site-copy-blocks/navigation-extras";

const globalSections = [
  {
    id: "1",
    pageKey: "global",
    sectionKey: "site-meta",
    sectionType: "text_section" as const,
    label: "Site metadata",
    visible: true,
    sortOrder: 0,
    content: { headline: "Custom Site Name" },
    settings: {},
  },
  {
    id: "2",
    pageKey: "global",
    sectionKey: "footer",
    sectionType: "text_section" as const,
    label: "Footer blurb",
    visible: true,
    sortOrder: 1,
    content: { body: "Serving with Team Expansion to multiply disciples." },
    settings: {},
  },
  {
    id: "3",
    pageKey: "global",
    sectionKey: "footer-nav",
    sectionType: "text_section" as const,
    label: "Footer navigation",
    visible: true,
    sortOrder: 2,
    content: {
      bullets: [{ id: "b1", text: "Custom Home → /", visible: true, sortOrder: 0 }],
    },
    settings: {},
  },
  {
    id: "4",
    pageKey: "global",
    sectionKey: "give-now-button",
    sectionType: "text_section" as const,
    label: "Give Now button",
    visible: true,
    sortOrder: 3,
    content: { primaryCtaLabel: "Give Today", primaryCtaUrl: "/give" },
    settings: {},
  },
  {
    id: "5",
    pageKey: "global",
    sectionKey: "get-involved-menu",
    sectionType: "card_grid" as const,
    label: "Get Involved dropdown",
    visible: true,
    sortOrder: 4,
    content: {
      headline: "Join Us",
      cards: [
        {
          id: "c1",
          text: "Partner monthly",
          visible: true,
          sortOrder: 0,
          metadata: { href: "/partner", body: "Monthly support" },
        },
      ],
    },
    settings: {},
  },
  {
    id: "6",
    pageKey: "global",
    sectionKey: "legal",
    sectionType: "text_section" as const,
    label: "Support contact",
    visible: true,
    sortOrder: 5,
    content: { headline: "help@example.com", body: "within 24 hours" },
    settings: {},
  },
];

describe("parseNavBulletLine", () => {
  it("parses label and href from bullet text", () => {
    expect(parseNavBulletLine("Become a Partner → /partner")).toEqual({
      label: "Become a Partner",
      href: "/partner",
    });
  });
});

describe("resolveStorefrontShellContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(pageHasCustomSections).mockResolvedValue(true);
    vi.mocked(loadPageSections).mockResolvedValue(globalSections);
    vi.mocked(getSiteCopy).mockResolvedValue(DEFAULT_SITE_COPY);
    vi.mocked(getSiteCopyBlocksForAdmin).mockResolvedValue([]);
    vi.mocked(resolveNavigationExtras).mockReturnValue({
      giveNowLabel: GIVE_NOW_NAV.label,
      getInvolvedItems: [],
    });
  });

  it("prefers Site Builder global sections when saved", async () => {
    const shell = await resolveStorefrontShellContent();

    expect(shell.footerBlurb.source).toBe("site_page_sections");
    expect(shell.footerBlurb.databaseKey).toBe(FOOTER_BLURB_SITE_BUILDER_KEY);
    expect(shell.footerBlurb.value).toContain("Serving with Team Expansion");
    expect(shell.siteName.value).toBe("Custom Site Name");
    expect(shell.giveNow.value.label).toBe("Give Today");
    expect(shell.getInvolved.value.label).toBe("Join Us");
    expect(shell.footerNavLinks.value[0]?.label).toBe("Custom Home");
    expect(shell.legalSupport.value.supportEmail).toBe("help@example.com");
  });

  it("falls back to site_copy when global sections are not saved", async () => {
    vi.mocked(pageHasCustomSections).mockResolvedValue(false);
    vi.mocked(loadPageSections).mockResolvedValue(globalSections);
    vi.mocked(getSiteCopy).mockResolvedValue({
      ...DEFAULT_SITE_COPY,
      footer: { blurb: "Legacy footer blurb from site_copy." },
    });

    const shell = await resolveStorefrontShellContent();

    expect(shell.footerBlurb.source).toBe("site_copy");
    expect(shell.footerBlurb.databaseKey).toBe(FOOTER_BLURB_LEGACY_KEY);
    expect(shell.footerBlurb.value).toBe("Legacy footer blurb from site_copy.");
    expect(shell.footerNavLinks.source).toBe("hardcoded");
    expect(shell.footerNavLinks.value).toEqual(STOREFRONT_FOOTER_NAV);
  });
});

describe("resolveFooterBlurb", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(pageHasCustomSections).mockResolvedValue(true);
    vi.mocked(loadPageSections).mockResolvedValue(globalSections);
    vi.mocked(getSiteCopy).mockResolvedValue(DEFAULT_SITE_COPY);
    vi.mocked(getSiteCopyBlocksForAdmin).mockResolvedValue([]);
    vi.mocked(resolveNavigationExtras).mockReturnValue({
      giveNowLabel: GIVE_NOW_NAV.label,
      getInvolvedItems: [],
    });
  });

  it("remains compatible with the footer blurb helper", async () => {
    const resolved = await resolveFooterBlurb();
    expect(resolved.source).toBe("site_page_sections");
    expect(resolved.text).toContain("Serving with Team Expansion");
  });
});
