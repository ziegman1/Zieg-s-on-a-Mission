import { describe, expect, it, vi, beforeEach } from "vitest";
import type { NewsletterRecord } from "./types";

vi.mock("@/lib/newsletter/newsletter-db", () => ({
  listPublishedNewsletters: vi.fn(),
}));

import { listPublishedNewsletters } from "@/lib/newsletter/newsletter-db";
import { listMissionHubNewsletterArchive } from "./mission-hub-newsletter-archive";
import {
  sortNewsletterArchiveItems,
  type MissionHubNewsletterArchiveItem,
} from "./mission-hub-newsletter-archive-types";

function newsletter(overrides: Partial<NewsletterRecord> = {}): NewsletterRecord {
  return {
    id: "nl_1",
    title: "Issue One",
    subtitle: "",
    slug: "issue-one",
    issueDate: "2026-01-01T00:00:00.000Z",
    headerImageUrl: null,
    useDefaultBrandedHeader: true,
    featuredImageUrl: null,
    excerpt: "First excerpt.",
    body: "",
    bodyBlocks: [],
    ctaLabel: "",
    ctaUrl: "",
    ctaAlign: "center",
    footerImageUrl: null,
    footerAltText: "",
    useDefaultFooterImage: true,
    seoTitle: "",
    seoDescription: "",
    status: "PUBLISHED",
    publishedAt: "2026-01-10T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-10T00:00:00.000Z",
    ...overrides,
  };
}

describe("mission hub newsletter archive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps published newsletters to archive cards linking to public pages", async () => {
    vi.mocked(listPublishedNewsletters).mockResolvedValue([
      newsletter({ id: "nl_a", slug: "march-update", title: "March Update" }),
    ]);

    const items = await listMissionHubNewsletterArchive();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "nl_a",
      title: "March Update",
      excerpt: "First excerpt.",
      newsletterPath: "/newsletters/march-update",
    });
  });

  it("uses subtitle when excerpt is empty", async () => {
    vi.mocked(listPublishedNewsletters).mockResolvedValue([
      newsletter({ excerpt: "", subtitle: "Subtitle teaser" }),
    ]);

    const items = await listMissionHubNewsletterArchive();
    expect(items[0]?.excerpt).toBe("Subtitle teaser");
  });

  it("sortNewsletterArchiveItems orders newest published first", () => {
    const older: MissionHubNewsletterArchiveItem = {
      id: "old",
      slug: "old",
      title: "Old",
      excerpt: "",
      issueDate: "2025-01-01T00:00:00.000Z",
      issueDateLabel: null,
      publishedAt: "2025-06-01T00:00:00.000Z",
      publishedAtLabel: null,
      newsletterPath: "/newsletters/old",
    };
    const newer: MissionHubNewsletterArchiveItem = {
      id: "new",
      slug: "new",
      title: "New",
      excerpt: "",
      issueDate: "2026-01-01T00:00:00.000Z",
      issueDateLabel: null,
      publishedAt: "2026-06-01T00:00:00.000Z",
      publishedAtLabel: null,
      newsletterPath: "/newsletters/new",
    };

    const sorted = sortNewsletterArchiveItems([older, newer]);
    expect(sorted.map((i) => i.id)).toEqual(["new", "old"]);
  });
});
