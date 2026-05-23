import { describe, expect, it } from "vitest";
import {
  isValidNewsletterLinkUrl,
  normalizeNewsletterLinkUrl,
  NEWSLETTER_LINK_URL_ERROR,
  validateNewsletterLinkUrl,
} from "./cta-url";

describe("normalizeNewsletterLinkUrl", () => {
  it("trims whitespace", () => {
    expect(normalizeNewsletterLinkUrl("  /partner  ")).toBe("/partner");
    expect(normalizeNewsletterLinkUrl("  https://example.com/  ")).toBe("https://example.com/");
  });
});

describe("isValidNewsletterLinkUrl", () => {
  it("accepts https://teamexpansion.org/theziegenhorns/", () => {
    expect(isValidNewsletterLinkUrl("https://teamexpansion.org/theziegenhorns/")).toBe(true);
  });

  it("accepts trailing slash and query params", () => {
    expect(isValidNewsletterLinkUrl("https://example.com/path/")).toBe(true);
    expect(isValidNewsletterLinkUrl("https://example.com/x?a=1&b=2")).toBe(true);
    expect(isValidNewsletterLinkUrl("http://example.com/path")).toBe(true);
  });

  it("accepts relative internal paths", () => {
    expect(isValidNewsletterLinkUrl("/give")).toBe(true);
    expect(isValidNewsletterLinkUrl("/partner")).toBe(true);
    expect(isValidNewsletterLinkUrl("/newsletters/example")).toBe(true);
  });

  it("accepts empty optional URL", () => {
    expect(isValidNewsletterLinkUrl("")).toBe(true);
    expect(isValidNewsletterLinkUrl("   ")).toBe(true);
  });

  it("rejects javascript: and data:", () => {
    expect(isValidNewsletterLinkUrl("javascript:alert(1)")).toBe(false);
    expect(isValidNewsletterLinkUrl("data:text/html,hi")).toBe(false);
  });

  it("rejects plain text and malformed URLs", () => {
    expect(isValidNewsletterLinkUrl("not a url")).toBe(false);
    expect(isValidNewsletterLinkUrl("teamexpansion.org/path")).toBe(false);
    expect(isValidNewsletterLinkUrl("https://")).toBe(false);
  });

  it("rejects protocol-relative URLs", () => {
    expect(isValidNewsletterLinkUrl("//evil.com/phish")).toBe(false);
  });

  it("rejects file:// local paths", () => {
    expect(isValidNewsletterLinkUrl("file:///Users/me/doc.pdf")).toBe(false);
    expect(validateNewsletterLinkUrl("file:///C:/docs/guide.pdf")).toBe(
      "Local files must be uploaded before they can be used in newsletters.",
    );
  });

  it("rejects bare and encoded PDF filenames", () => {
    expect(isValidNewsletterLinkUrl("report.pdf")).toBe(false);
    expect(isValidNewsletterLinkUrl("026-03%20Report.pdf")).toBe(false);
    expect(validateNewsletterLinkUrl("report.pdf")).toContain("Upload this PDF");
  });
});

describe("validateNewsletterLinkUrl", () => {
  it("returns standard error message", () => {
    expect(validateNewsletterLinkUrl("nope")).toBe(NEWSLETTER_LINK_URL_ERROR);
    expect(validateNewsletterLinkUrl("/partner")).toBeNull();
  });
});
