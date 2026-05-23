import { describe, expect, it } from "vitest";
import { LOCAL_FILE_NEWSLETTER_URL_ERROR } from "@/lib/newsletter/document-url";
import { sanitizeNewsletterBlocksForEmail, resolveHostedUrlForEmail } from "./email-sanitize";
import { parseNewsletterBlocks } from "./parse";
import { validateNewsletterBlocks } from "./validate";
import { isBlockVisible, visibleNewsletterBlocks } from "./visible";
import type { DocumentBlock } from "./types";

const hostedPdf =
  "https://testref.supabase.co/storage/v1/object/public/newsletter-assets/newsletters/nl_1/documents/abc.pdf";

const documentBlock: DocumentBlock = {
  id: "doc-1",
  type: "document",
  documentUrl: hostedPdf,
  title: "Annual report",
  description: "Download the full PDF.",
  buttonLabel: "Download PDF",
  align: "center",
};

describe("document newsletter block", () => {
  it("parses stored document blocks", () => {
    const blocks = parseNewsletterBlocks([
      {
        id: "doc-1",
        type: "document",
        documentUrl: hostedPdf,
        title: "Report",
        buttonLabel: "Open PDF",
        align: "left",
      },
    ]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      type: "document",
      documentUrl: hostedPdf,
      buttonLabel: "Open PDF",
      align: "left",
    });
  });

  it("rejects file:// on publish validation", () => {
    const issues = validateNewsletterBlocks(
      [
        {
          ...documentBlock,
          documentUrl: "file:///Users/me/report.pdf",
        },
      ],
      "publish",
    );
    expect(issues[0]?.message).toBe(LOCAL_FILE_NEWSLETTER_URL_ERROR);
  });

  it("includes document blocks with hosted URL in public-visible blocks", () => {
    expect(isBlockVisible(documentBlock)).toBe(true);
    expect(visibleNewsletterBlocks([documentBlock])).toHaveLength(1);
    expect(isBlockVisible({ ...documentBlock, documentUrl: "file:///local.pdf" })).toBe(
      false,
    );
    expect(
      visibleNewsletterBlocks([
        { ...documentBlock, documentUrl: "file:///local.pdf" },
      ]),
    ).toHaveLength(0);
  });

  it("email payload uses hosted URL only and strips file://", () => {
    expect(resolveHostedUrlForEmail(hostedPdf)).toBe(hostedPdf);
    expect(resolveHostedUrlForEmail("file:///Users/me/report.pdf")).toBeNull();

    const sanitized = sanitizeNewsletterBlocksForEmail([
      documentBlock,
      { ...documentBlock, id: "doc-2", documentUrl: "file:///secret.pdf" },
    ]);
    expect(sanitized[0]?.type === "document" && sanitized[0].documentUrl).toBe(hostedPdf);
    expect(sanitized[1]?.type === "document" && sanitized[1].documentUrl).toBe("");
  });
});
