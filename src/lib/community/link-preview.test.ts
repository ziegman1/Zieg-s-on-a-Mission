import { describe, expect, it } from "vitest";
import {
  isSafeLinkPreviewUrl,
  parseOpenGraphFromHtml,
} from "./link-preview";

describe("link-preview", () => {
  it("blocks unsafe preview targets", () => {
    expect(isSafeLinkPreviewUrl("http://127.0.0.1/secret")).toBe(false);
    expect(isSafeLinkPreviewUrl("http://localhost/admin")).toBe(false);
    expect(isSafeLinkPreviewUrl("https://example.com/article")).toBe(true);
  });

  it("parses Open Graph metadata from HTML", () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="Example Article" />
          <meta property="og:description" content="A short summary." />
          <meta property="og:image" content="/images/cover.jpg" />
        </head>
      </html>
    `;

    expect(parseOpenGraphFromHtml(html, "https://example.com/article")).toEqual({
      url: "https://example.com/article",
      hostname: "example.com",
      title: "Example Article",
      description: "A short summary.",
      imageUrl: "https://example.com/images/cover.jpg",
    });
  });

  it("falls back to the document title when Open Graph tags are missing", () => {
    const html = "<html><head><title>Fallback Title</title></head></html>";
    expect(parseOpenGraphFromHtml(html, "https://news.example.org/story")).toMatchObject({
      title: "Fallback Title",
      hostname: "news.example.org",
    });
  });
});
