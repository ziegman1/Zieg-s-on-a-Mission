import { BUILDER_PAGES, NEWSLETTER_BUILDER_NAV } from "@/lib/site-builder/types";
import type { NewsletterComposerLayoutMode } from "@/lib/newsletter/composer-layout";

export const SITE_BUILDER_PATH = "/admin/site-builder";

const DEFAULT_PAGE = "home";

const VALID_PAGE_KEYS = new Set([
  ...BUILDER_PAGES.map((p) => p.pageKey),
  NEWSLETTER_BUILDER_NAV.id,
]);

export type SiteBuilderBlogTab = "intro" | "posts";

export type SiteBuilderNewsletterTab = "issues" | "branding";

export type SiteBuilderSearchState = {
  page: string;
  blogTab: SiteBuilderBlogTab;
  newsletterTab: SiteBuilderNewsletterTab;
  issue: string | null;
  mode: NewsletterComposerLayoutMode;
};

export function parseComposerMode(value: string | null): NewsletterComposerLayoutMode {
  if (value === "edit" || value === "preview") return value;
  return "split";
}

type SearchParamsLike = { get(name: string): string | null };

export function parseSiteBuilderSearchParams(params: SearchParamsLike): SiteBuilderSearchState {
  const rawPage = params.get("page")?.trim() || DEFAULT_PAGE;
  const page = VALID_PAGE_KEYS.has(rawPage) ? rawPage : DEFAULT_PAGE;

  const blogTab = params.get("blogTab") === "intro" ? "intro" : "posts";

  const newsletterTab = params.get("tab") === "branding" ? "branding" : "issues";

  const issueRaw = params.get("issue")?.trim();
  const issue = issueRaw && issueRaw.length > 0 ? issueRaw : null;

  const mode = parseComposerMode(params.get("mode"));

  return { page, blogTab, newsletterTab, issue, mode };
}

/** Build query string (without leading `?`). Omits defaults where sensible. */
export function buildSiteBuilderSearchParams(
  state: Partial<SiteBuilderSearchState> & { page: string },
): string {
  const page = state.page;
  const params = new URLSearchParams();
  params.set("page", page);

  if (page === "blog" && state.blogTab === "intro") {
    params.set("blogTab", "intro");
  }

  if (page === NEWSLETTER_BUILDER_NAV.id) {
    if (state.newsletterTab === "branding") {
      params.set("tab", "branding");
    }
    if (state.newsletterTab !== "branding" && state.issue) {
      params.set("issue", state.issue);
      if (state.mode && state.mode !== "split") {
        params.set("mode", state.mode);
      }
    }
  }

  return params.toString();
}

export function siteBuilderHref(state: Partial<SiteBuilderSearchState> & { page: string }): string {
  const qs = buildSiteBuilderSearchParams(state);
  return qs ? `${SITE_BUILDER_PATH}?${qs}` : SITE_BUILDER_PATH;
}

export function mergeSiteBuilderSearchState(
  current: SiteBuilderSearchState,
  patch: Partial<SiteBuilderSearchState>,
): SiteBuilderSearchState {
  const page = patch.page ?? current.page;
  const next: SiteBuilderSearchState = {
    page,
    blogTab: patch.blogTab ?? current.blogTab,
    newsletterTab: patch.newsletterTab ?? current.newsletterTab,
    issue: patch.issue !== undefined ? patch.issue : current.issue,
    mode: patch.mode ?? current.mode,
  };

  if (page !== NEWSLETTER_BUILDER_NAV.id) {
    next.newsletterTab = "issues";
    next.issue = null;
    next.mode = "split";
  } else if (next.newsletterTab === "branding") {
    next.issue = null;
    next.mode = "split";
  }

  if (page === "blog" && patch.blogTab === undefined && current.page !== "blog") {
    next.blogTab = "posts";
  }

  return next;
}
