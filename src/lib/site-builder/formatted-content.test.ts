import { describe, expect, it } from "vitest";
import {
  buildFormattedContentHtml,
  markdownToHtml,
  plainTextToHtml,
  sanitizeSiteBuilderHtml,
} from "./formatted-content";

describe("plainTextToHtml", () => {
  it("converts double line breaks into paragraphs", () => {
    expect(plainTextToHtml("First paragraph.\n\nSecond paragraph.")).toBe(
      "<p>First paragraph.</p><p>Second paragraph.</p>",
    );
  });

  it("preserves single line breaks within a paragraph", () => {
    expect(plainTextToHtml("Line one\nLine two")).toBe("<p>Line one<br />Line two</p>");
  });
});

describe("buildFormattedContentHtml", () => {
  it("renders plain text with paragraph spacing", () => {
    expect(buildFormattedContentHtml("Intro\n\nBody")).toBe(
      "<p>Intro</p><p>Body</p>",
    );
  });

  it("passes through safe HTML formatting", () => {
    const html = buildFormattedContentHtml("<p><strong>Bold</strong> and <em>italic</em></p>");
    expect(html).toContain("<strong>Bold</strong>");
    expect(html).toContain("<em>italic</em>");
  });

  it("strips unsafe HTML", () => {
    const html = buildFormattedContentHtml('<p>Safe</p><script>alert("x")</script>');
    expect(html).toBe("<p>Safe</p>");
  });

  it("supports JSON rich text payloads with html field", () => {
    const html = buildFormattedContentHtml(
      JSON.stringify({ html: "<p>From JSON</p><p>Second</p>" }),
    );
    expect(html).toBe("<p>From JSON</p><p>Second</p>");
  });

  it("converts markdown to HTML on load", () => {
    const html = buildFormattedContentHtml("## Heading\n\n**Bold** intro");
    expect(html).toContain("<h2>Heading</h2>");
    expect(html).toContain("<strong>Bold</strong>");
  });
});

describe("markdownToHtml", () => {
  it("renders blockquotes and lists", () => {
    const html = markdownToHtml("> Quote line\n\n- One\n- Two");
    expect(html).toContain("<blockquote>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>One</li>");
  });
});

describe("sanitizeSiteBuilderHtml", () => {
  it("removes inline event handlers", () => {
    expect(sanitizeSiteBuilderHtml('<p onclick="evil()">Text</p>')).toBe("<p>Text</p>");
  });
});
