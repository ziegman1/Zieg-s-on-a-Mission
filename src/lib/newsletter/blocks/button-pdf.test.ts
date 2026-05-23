import { describe, expect, it } from "vitest";
import { isBlockVisible } from "./visible";
import { validateNewsletterBlocks } from "./validate";
import type { ButtonBlock } from "./types";

const hostedPdf =
  "https://testref.supabase.co/storage/v1/object/public/newsletter-assets/temp/documents/guide.pdf";

describe("Button block PDF links", () => {
  const buttonWithHostedPdf: ButtonBlock = {
    id: "btn-1",
    type: "button",
    label: "Download report",
    url: hostedPdf,
    align: "center",
  };

  it("preview-visible button uses hosted PDF URL", () => {
    expect(isBlockVisible(buttonWithHostedPdf)).toBe(true);
    expect(buttonWithHostedPdf.url).toBe(hostedPdf);
  });

  it("passes validation after PDF is uploaded to hosted URL", () => {
    expect(validateNewsletterBlocks([buttonWithHostedPdf], "publish")).toHaveLength(0);
  });

  it("fails validation for bare filename until upload", () => {
    const issues = validateNewsletterBlocks(
      [{ ...buttonWithHostedPdf, url: "026-03%20Report.pdf" }],
      "publish",
    );
    expect(issues[0]?.message).toContain("Upload this PDF");
  });

  it("fails validation for file:// until upload", () => {
    const issues = validateNewsletterBlocks(
      [{ ...buttonWithHostedPdf, url: "file:///Users/me/report.pdf" }],
      "draft",
    );
    expect(issues[0]?.message).toMatch(/upload|Local files/i);
  });
});
