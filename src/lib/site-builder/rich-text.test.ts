import { describe, expect, it } from "vitest";
import {
  normalizeInlineRichTextForStorage,
  normalizeRichTextForStorage,
  plainTextToRichTextStorage,
  prepareRichTextForEditor,
} from "./rich-text";
import { richTextModeForField } from "./rich-text-field-policy";

describe("prepareRichTextForEditor", () => {
  it("wraps legacy plain text in paragraphs", () => {
    expect(prepareRichTextForEditor("Line one\n\nLine two")).toBe(
      "<p>Line one</p><p>Line two</p>",
    );
  });

  it("converts legacy markdown on load", () => {
    expect(prepareRichTextForEditor("**Bold** line")).toContain("<strong>Bold</strong>");
  });
});

describe("normalizeRichTextForStorage", () => {
  it("sanitizes editor HTML before storage", () => {
    expect(normalizeRichTextForStorage('<p>Hello</p><script>x</script>')).toBe("<p>Hello</p>");
  });

  it("stores migrated plain text as sanitized HTML paragraphs", () => {
    expect(plainTextToRichTextStorage("One\n\nTwo")).toBe("<p>One</p><p>Two</p>");
  });
});

describe("normalizeInlineRichTextForStorage", () => {
  it("strips block tags from inline fields", () => {
    expect(normalizeInlineRichTextForStorage("<p><strong>Title</strong></p>")).toBe(
      "<strong>Title</strong>",
    );
  });
});

describe("richTextModeForField", () => {
  it("keeps button labels plain", () => {
    expect(richTextModeForField("primaryCtaLabel")).toBe("plain");
  });

  it("uses full rich text for body fields", () => {
    expect(richTextModeForField("body", { multiline: true })).toBe("full");
  });

  it("uses full rich text for headlines", () => {
    expect(richTextModeForField("headline")).toBe("full");
  });

  it("uses full rich text for subheadline", () => {
    expect(richTextModeForField("subheadline")).toBe("full");
  });
});
