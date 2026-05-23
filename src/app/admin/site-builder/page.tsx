import { listBlogPostsForAdmin } from "@/lib/blog/blog-db";
import { formatBlogError } from "@/lib/blog/errors";
import { BUILDER_PAGES } from "@/lib/site-builder/types";
import { loadPageSectionsForAdmin } from "@/lib/site-builder/sections-db";
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

  return (
    <div className="space-y-2">
      <h1 className="font-serif text-2xl text-brand-primary tracking-wide">Site builder</h1>
      <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
        Visual editor for storefront pages. Save updates the live site (no separate publish step required).
        On <strong className="text-zinc-300">Blog</strong>, use the Blog posts tab to publish stories — the page
        intro is still edited in Page intro.
      </p>
      <SiteBuilderEditor
        initialPages={initialPages}
        initialBlogPosts={initialBlogPosts}
        blogLoadError={blogLoadError}
      />
    </div>
  );
}
