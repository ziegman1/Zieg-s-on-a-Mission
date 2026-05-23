import { describe, expect, it } from "vitest";
import { createNewsletterBlock } from "./factory";
import type {
  ButtonBlock,
  HeadingBlock,
  ImageBlock,
  QuoteBlock,
  TextBlock,
} from "./types";
import { parseNewsletterBlocks } from "./parse";
import { blocksToPlainBody } from "./plain-text";
import {
  assertNewsletterContent,
  validateNewsletterBlocks,
} from "./validate";
import {
  hasVisibleNewsletterContent,
  isBlockVisible,
  visibleNewsletterBlocks,
} from "./visible";

describe("parseNewsletterBlocks", () => {
  it("returns empty array for non-array input", () => {
    expect(parseNewsletterBlocks(null)).toEqual([]);
    expect(parseNewsletterBlocks({})).toEqual([]);
  });

  it("drops invalid entries and keeps valid blocks", () => {
    const valid = createNewsletterBlock("text") as TextBlock;
    valid.content = "Hello";
    const parsed = parseNewsletterBlocks([
      valid,
      { id: "", type: "text" },
      { type: "unknown" },
      { id: "x", type: "heading", text: "Title", level: "h2" },
    ]);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject({ type: "text", content: "Hello" });
    expect(parsed[1]).toMatchObject({ type: "heading", text: "Title" });
  });
});

describe("visibleNewsletterBlocks", () => {
  it("omits empty blocks but keeps divider and spacer", () => {
    const emptyText = createNewsletterBlock("text");
    const divider = createNewsletterBlock("divider");
    const spacer = createNewsletterBlock("spacer");
    const heading = createNewsletterBlock("heading") as HeadingBlock;
    heading.text = "Section";

    const visible = visibleNewsletterBlocks([emptyText, divider, spacer, heading]);
    expect(visible.map((b) => b.type)).toEqual(["divider", "spacer", "heading"]);
    expect(isBlockVisible(emptyText)).toBe(false);
  });

  it("requires image URL and alt for image blocks", () => {
    const img = createNewsletterBlock("image") as ImageBlock;
    img.imageUrl = "https://cdn.example.com/a.jpg";
    img.alt = "Alt text";
    expect(isBlockVisible(img)).toBe(true);

    img.alt = "";
    expect(isBlockVisible(img)).toBe(false);
  });

  it("preserves block order for public render", () => {
    const a = createNewsletterBlock("heading") as HeadingBlock;
    a.text = "First";
    const b = createNewsletterBlock("text") as TextBlock;
    b.content = "Second";
    const c = createNewsletterBlock("quote") as QuoteBlock;
    c.text = "Third";

    const visible = visibleNewsletterBlocks([a, b, c]);
    expect(visible.map((b) => b.type)).toEqual(["heading", "text", "quote"]);
  });
});

describe("hasVisibleNewsletterContent", () => {
  it("accepts legacy body when bodyBlocks is empty", () => {
    expect(hasVisibleNewsletterContent("Legacy plain body", [])).toBe(true);
    expect(hasVisibleNewsletterContent("  ", [])).toBe(false);
  });

  it("accepts visible blocks without legacy body", () => {
    const block = createNewsletterBlock("text") as TextBlock;
    block.content = "Block content";
    expect(hasVisibleNewsletterContent("", [block])).toBe(true);
  });
});

describe("blocksToPlainBody", () => {
  it("derives plain text from ordered blocks", () => {
    const h = createNewsletterBlock("heading") as HeadingBlock;
    h.text = "Title";
    const t = createNewsletterBlock("text") as TextBlock;
    t.content = "Paragraph one.";
    const plain = blocksToPlainBody([h, t]);
    expect(plain).toContain("Title");
    expect(plain).toContain("Paragraph one.");
  });
});

describe("validateNewsletterBlocks", () => {
  it("defaults image_text button alignment to center when missing", () => {
    const parsed = parseNewsletterBlocks([
      {
        id: "x",
        type: "image_text",
        imageUrl: "https://example.com/a.jpg",
        alt: "Alt",
        buttonLabel: "Go",
        buttonUrl: "https://example.com",
      },
    ]);
    expect(parsed[0]).toMatchObject({ type: "image_text", buttonAlign: "center" });
  });

  it("rejects image without alt when URL is set (publish intent)", () => {
    const img = createNewsletterBlock("image") as ImageBlock;
    img.imageUrl = "https://example.com/x.jpg";
    const issues = validateNewsletterBlocks([img], "publish");
    expect(issues[0]?.message).toMatch(/alt/i);
  });

  it("rejects partial button blocks (publish intent)", () => {
    const btn = createNewsletterBlock("button") as ButtonBlock;
    btn.label = "Click";
    const issues = validateNewsletterBlocks([btn], "publish");
    expect(issues[0]?.message).toMatch(/label and URL/i);
  });
});

describe("assertNewsletterContent", () => {
  it("requires visible content on publish", () => {
    expect(() => assertNewsletterContent("", [], "publish")).toThrow(
      /content block/i,
    );
  });

  it("allows publish with legacy body only", () => {
    expect(() =>
      assertNewsletterContent("Legacy newsletter body", [], "publish"),
    ).not.toThrow();
  });

  it("allows publish with visible blocks", () => {
    const block = createNewsletterBlock("text") as TextBlock;
    block.content = "Ready to send";
    expect(() => assertNewsletterContent("", [block], "publish")).not.toThrow();
  });
});
