import { listBlogPostsForAdmin } from "@/lib/blog/blog-db";
import { formatBlogError } from "@/lib/blog/errors";
import { getNewsletterBrandSettings } from "@/lib/newsletter/brand-settings";
import { listNewslettersForAdmin } from "@/lib/newsletter/newsletter-db";
import {
  formatNewsletterDiagnosticsSummary,
  getNewsletterDatabaseDiagnostics,
} from "@/lib/newsletter/diagnostics";
import { formatNewsletterError, logNewsletterAction } from "@/lib/newsletter/errors";
import { BUILDER_PAGES } from "@/lib/site-builder/types";
import { loadPageSectionsForAdmin } from "@/lib/site-builder/sections-db";
import { Suspense } from "react";
import { SiteBuilderEditor } from "./site-builder-editor";

export const dynamic = "force-dynamic";

export default async function AdminSiteBuilderPage() {
  const initialPages: Record<
    string,
    { sections: Awaited<ReturnType<typeof loadPageSectionsForAdmin>>["sections"]; hasCustom: boolean }
  > = {};

  for (const { pageKey } of BUILDER_PAGES) {
    initialPages[pageKey] = await loadPageSectionsForAdmin(pageKey);
  }

  let initialBlogPosts: Awaited<ReturnType<typeof listBlogPostsForAdmin>> = [];
  let blogLoadError: string | null = null;
  try {
    initialBlogPosts = await listBlogPostsForAdmin();
  } catch (e) {
    console.error("[blog] site-builder load", e);
    blogLoadError = formatBlogError(e);
  }

  let initialNewsletters: Awaited<ReturnType<typeof listNewslettersForAdmin>> = [];
  let newsletterLoadError: string | null = null;
  let initialNewsletterBrand = await getNewsletterBrandSettings();
  try {
    initialNewsletters = await listNewslettersForAdmin();
  } catch (e) {
    logNewsletterAction("site-builder-load", {}, e);
    newsletterLoadError = formatNewsletterError(e);
    if (process.env.NODE_ENV !== "production") {
      try {
        const diagnostics = await getNewsletterDatabaseDiagnostics();
        logNewsletterAction("site-builder-load-diagnostics", diagnostics);
        const summary = formatNewsletterDiagnosticsSummary(diagnostics);
        if (summary.trim()) {
          newsletterLoadError = `${newsletterLoadError}\n\nDiagnostic: ${summary}`;
        }
      } catch (diagErr) {
        logNewsletterAction("site-builder-load-diagnostics", {}, diagErr);
      }
    }
  }

  return (
    <div className="space-y-2">
      <h1 className="font-serif text-2xl text-brand-primary tracking-wide">Site builder</h1>
      <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
        Visual editor for storefront pages. Save updates the live site (no separate publish step required).
        On <strong className="text-zinc-300">Blog</strong>, use Blog posts for stories (Page intro for the blog
        header). <strong className="text-zinc-300">Community</strong> edits the Mission Hub landing above the feed.{" "}
        <strong className="text-zinc-300">Newsletters</strong> are managed separately from page sections.
      </p>
      <Suspense
        fallback={
          <p className="text-sm text-zinc-500 py-8">Loading site builder…</p>
        }
      >
        <SiteBuilderEditor
          initialPages={initialPages}
          initialBlogPosts={initialBlogPosts}
          blogLoadError={blogLoadError}
          initialNewsletters={initialNewsletters}
          initialNewsletterBrand={initialNewsletterBrand}
          newsletterLoadError={newsletterLoadError}
        />
      </Suspense>
    </div>
  );
}
