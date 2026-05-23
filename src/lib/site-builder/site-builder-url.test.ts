import { describe, expect, it } from "vitest";
import {
  buildSiteBuilderSearchParams,
  mergeSiteBuilderSearchState,
  parseSiteBuilderSearchParams,
  siteBuilderHref,
} from "./site-builder-url";

describe("parseSiteBuilderSearchParams", () => {
  it("defaults to home when page is missing", () => {
    expect(parseSiteBuilderSearchParams(new URLSearchParams())).toMatchObject({
      page: "home",
      blogTab: "posts",
      newsletterTab: "issues",
      issue: null,
      mode: "split",
    });
  });

  it("parses newsletters with issue and mode", () => {
    const state = parseSiteBuilderSearchParams(
      new URLSearchParams("page=newsletters&tab=issues&issue=nl_abc&mode=preview"),
    );
    expect(state.page).toBe("newsletters");
    expect(state.issue).toBe("nl_abc");
    expect(state.mode).toBe("preview");
  });

  it("parses branding tab without issue", () => {
    const state = parseSiteBuilderSearchParams(
      new URLSearchParams("page=newsletters&tab=branding"),
    );
    expect(state.newsletterTab).toBe("branding");
    expect(state.issue).toBeNull();
  });

  it("parses new issue draft", () => {
    const state = parseSiteBuilderSearchParams(
      new URLSearchParams("page=newsletters&issue=new&mode=split"),
    );
    expect(state.issue).toBe("new");
    expect(state.mode).toBe("split");
  });
});

describe("buildSiteBuilderSearchParams", () => {
  it("builds newsletters branding URL", () => {
    expect(
      siteBuilderHref({ page: "newsletters", newsletterTab: "branding" }),
    ).toBe("/admin/site-builder?page=newsletters&tab=branding");
  });

  it("builds newsletters issue split URL without redundant mode", () => {
    const href = siteBuilderHref({
      page: "newsletters",
      newsletterTab: "issues",
      issue: "nl_1",
      mode: "split",
    });
    expect(href).toBe("/admin/site-builder?page=newsletters&issue=nl_1");
  });

  it("includes non-default composer mode", () => {
    const qs = buildSiteBuilderSearchParams({
      page: "newsletters",
      newsletterTab: "issues",
      issue: "nl_1",
      mode: "edit",
    });
    expect(qs).toContain("mode=edit");
  });
});

describe("mergeSiteBuilderSearchState", () => {
  it("clears newsletter issue when leaving newsletters page", () => {
    const current = parseSiteBuilderSearchParams(
      new URLSearchParams("page=newsletters&issue=nl_1&mode=preview"),
    );
    const next = mergeSiteBuilderSearchState(current, { page: "home" });
    expect(next.page).toBe("home");
    expect(next.issue).toBeNull();
    expect(next.mode).toBe("split");
  });

  it("round-trips refresh URL for newsletters issue in split mode", () => {
    const href = siteBuilderHref({
      page: "newsletters",
      newsletterTab: "issues",
      issue: "nl_abc",
      mode: "split",
    });
    const parsed = parseSiteBuilderSearchParams(new URLSearchParams(href.split("?")[1] ?? ""));
    expect(parsed.page).toBe("newsletters");
    expect(parsed.issue).toBe("nl_abc");
    expect(parsed.mode).toBe("split");
  });

  it("round-trips refresh URL for new newsletter draft", () => {
    const parsed = parseSiteBuilderSearchParams(
      new URLSearchParams("page=newsletters&issue=new&mode=edit"),
    );
    expect(parsed.issue).toBe("new");
    expect(parsed.mode).toBe("edit");
  });

  it("clears issue when switching to branding tab", () => {
    const current = parseSiteBuilderSearchParams(
      new URLSearchParams("page=newsletters&issue=nl_1"),
    );
    const next = mergeSiteBuilderSearchState(current, { newsletterTab: "branding" });
    expect(next.newsletterTab).toBe("branding");
    expect(next.issue).toBeNull();
  });
});
