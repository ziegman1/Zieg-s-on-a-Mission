import { describe, expect, it } from "vitest";
import { DEFAULT_NEWSLETTER_BRAND_SETTINGS } from "./brand-defaults";
import { buildNewsletterEmailPayload } from "./newsletter-email-payload";
import type { NewsletterRecord } from "./types";

const sample: NewsletterRecord = {
  id: "nl_1",
  title: "March Update",
  subtitle: "",
  slug: "march-update",
  issueDate: null,
  headerImageUrl: null,
  useDefaultBrandedHeader: true,
  featuredImageUrl: null,
  excerpt: "Preview",
  body: "Body",
  bodyBlocks: [],
  ctaLabel: "Give",
  ctaUrl: "https://example.com/give",
  ctaAlign: "right",
  footerImageUrl: null,
  footerAltText: "",
  useDefaultFooterImage: true,
  seoTitle: "",
  seoDescription: "",
  status: "PUBLISHED",
  publishedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("buildNewsletterEmailPayload", () => {
  it("includes CTA alignment and footer image for email rendering", () => {
    const brand = {
      ...DEFAULT_NEWSLETTER_BRAND_SETTINGS,
      defaultFooterImageUrl: "https://cdn.example.com/footer.png",
      footerAltText: "Footer",
    };
    const payload = buildNewsletterEmailPayload(sample, brand);
    expect(payload.cta?.align).toBe("right");
    expect(payload.footer.imageUrl).toBe("https://cdn.example.com/footer.png");
    expect(payload.header.imageUrl).toBeNull();
  });

  it("prefers issue footer override in payload", () => {
    const brand = {
      ...DEFAULT_NEWSLETTER_BRAND_SETTINGS,
      defaultFooterImageUrl: "https://cdn.example.com/default-footer.png",
    };
    const payload = buildNewsletterEmailPayload(
      {
        ...sample,
        footerImageUrl: "https://cdn.example.com/issue-footer.png",
        useDefaultFooterImage: false,
      },
      brand,
    );
    expect(payload.footer.imageUrl).toBe("https://cdn.example.com/issue-footer.png");
  });

  it("sanitizes document blocks to hosted URLs only for email", () => {
    const hosted =
      "https://testref.supabase.co/storage/v1/object/public/newsletter-assets/temp/documents/a.pdf";
    const payload = buildNewsletterEmailPayload(
      {
        ...sample,
        bodyBlocks: [
          {
            id: "d1",
            type: "document",
            documentUrl: hosted,
            title: "Guide",
            description: "",
            buttonLabel: "Download",
            align: "center",
          },
          {
            id: "d2",
            type: "document",
            documentUrl: "file:///Users/me/local.pdf",
            title: "Bad",
            description: "",
            buttonLabel: "Download",
            align: "center",
          },
        ],
      },
      DEFAULT_NEWSLETTER_BRAND_SETTINGS,
    );
    const doc = payload.blocks.filter((b) => b.type === "document");
    expect(doc[0]?.type === "document" && doc[0].documentUrl).toBe(hosted);
    expect(doc[1]?.type === "document" && doc[1].documentUrl).toBe("");
  });
});
