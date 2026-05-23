import { describe, expect, it } from "vitest";
import { buildNewsletterAssetPath, buildNewsletterDocumentPath } from "./storage-paths";

describe("buildNewsletterAssetPath", () => {
  it("places branding header/footer without newsletter id", () => {
    expect(buildNewsletterAssetPath("header", "jpg")).toMatch(
      /^branding\/header\/[0-9a-f-]+\.jpg$/,
    );
    expect(buildNewsletterAssetPath("footer", "png")).toMatch(
      /^branding\/footer\/[0-9a-f-]+\.png$/,
    );
  });

  it("places issue assets under newsletters/{id}", () => {
    const featured = buildNewsletterAssetPath("featured", "webp", {
      newsletterId: "nl_abc123",
    });
    expect(featured).toMatch(/^newsletters\/nl_abc123\/featured\/[0-9a-f-]+\.webp$/);

    const block = buildNewsletterAssetPath("block", "jpg", {
      newsletterId: "nl_abc123",
    });
    expect(block).toMatch(/^newsletters\/nl_abc123\/blocks\/[0-9a-f-]+\.jpg$/);

    const header = buildNewsletterAssetPath("header", "jpg", {
      newsletterId: "nl_abc123",
    });
    expect(header).toMatch(/^newsletters\/nl_abc123\/header\/[0-9a-f-]+\.jpg$/);
  });

  it("uses temp/ for featured and blocks before first save", () => {
    expect(buildNewsletterAssetPath("featured", "jpg")).toMatch(
      /^temp\/featured\/[0-9a-f-]+\.jpg$/,
    );
    expect(buildNewsletterAssetPath("block", "jpg")).toMatch(
      /^temp\/block\/[0-9a-f-]+\.jpg$/,
    );
  });

  it("places PDFs under newsletters/{id}/documents or temp/documents", () => {
    expect(
      buildNewsletterDocumentPath("pdf", { newsletterId: "nl_abc123" }),
    ).toMatch(/^newsletters\/nl_abc123\/documents\/[0-9a-f-]+\.pdf$/);
    expect(buildNewsletterDocumentPath("pdf")).toMatch(/^temp\/documents\/[0-9a-f-]+\.pdf$/);
  });

  it("ignores invalid newsletter ids", () => {
    expect(
      buildNewsletterAssetPath("featured", "jpg", { newsletterId: "new" }),
    ).toMatch(/^temp\/featured\//);
    expect(
      buildNewsletterAssetPath("featured", "jpg", { newsletterId: "../hack" }),
    ).toMatch(/^temp\/featured\//);
  });
});
