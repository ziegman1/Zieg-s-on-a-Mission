import { describe, expect, it } from "vitest";
import {
  mergeSiteBuilderSearchState,
  parseSiteBuilderSearchParams,
  siteBuilderHref,
} from "./site-builder-url";

describe("site-builder URL (client navigation without server refetch)", () => {
  it("merges newsletter tab without requiring router", () => {
    const current = parseSiteBuilderSearchParams(
      new URLSearchParams("page=newsletters&issue=abc&mode=split"),
    );
    const next = mergeSiteBuilderSearchState(current, { newsletterTab: "branding" });
    expect(next.newsletterTab).toBe("branding");
    expect(next.issue).toBeNull();
    expect(siteBuilderHref(next)).toBe("/admin/site-builder?page=newsletters&tab=branding");
  });

  it("preserves issue when switching layout mode", () => {
    const current = parseSiteBuilderSearchParams(
      new URLSearchParams("page=newsletters&issue=abc&mode=split"),
    );
    const next = mergeSiteBuilderSearchState(current, { mode: "preview" });
    expect(next.issue).toBe("abc");
    expect(siteBuilderHref(next)).toContain("mode=preview");
  });
});
