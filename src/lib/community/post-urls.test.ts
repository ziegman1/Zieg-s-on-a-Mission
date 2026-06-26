import { describe, expect, it } from "vitest";
import {
  extractHttpUrlsFromText,
  getSingleWebpageUrlInText,
  normalizeDetectedHttpUrl,
  splitTextIntoLinkSegments,
} from "./post-urls";

describe("post-urls", () => {
  it("normalizes trailing punctuation away from detected URLs", () => {
    expect(normalizeDetectedHttpUrl("https://example.com/page.")).toBe("https://example.com/page");
    expect(getSingleWebpageUrlInText("(https://example.com/page)")).toBe("https://example.com/page");
  });

  it("extracts multiple distinct URLs from text", () => {
    expect(
      extractHttpUrlsFromText(
        "See https://example.com/a and also http://news.example.org/story.",
      ),
    ).toEqual(["https://example.com/a", "http://news.example.org/story"]);
  });

  it("returns a single webpage URL only when one URL is present", () => {
    expect(getSingleWebpageUrlInText("https://example.com/article")).toBe(
      "https://example.com/article",
    );
    expect(getSingleWebpageUrlInText("Read https://example.com/article for more.")).toBe(
      "https://example.com/article",
    );
    expect(
      getSingleWebpageUrlInText("https://example.com/a and https://example.com/b"),
    ).toBeNull();
  });

  it("splits text into plain and URL segments while preserving surrounding copy", () => {
    expect(
      splitTextIntoLinkSegments("Pray for https://example.com/need today #hope"),
    ).toEqual([
      { kind: "text", value: "Pray for " },
      { kind: "url", href: "https://example.com/need", display: "https://example.com/need" },
      { kind: "text", value: " today #hope" },
    ]);
  });

  it("preserves line breaks in plain text segments", () => {
    const segments = splitTextIntoLinkSegments("Line one\nhttps://example.com\nLine three");
    expect(segments[0]).toEqual({ kind: "text", value: "Line one\n" });
    expect(segments[2]).toEqual({ kind: "text", value: "\nLine three" });
  });
});
