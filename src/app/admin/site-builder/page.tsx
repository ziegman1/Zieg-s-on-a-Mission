import { BUILDER_PAGES } from "@/lib/site-builder/types";
import { loadPageSectionsForAdmin } from "@/lib/site-builder/sections-db";
import { SiteBuilderEditor } from "./site-builder-editor";

export default async function AdminSiteBuilderPage() {
  const initialPages: Record<
    string,
    { sections: Awaited<ReturnType<typeof loadPageSectionsForAdmin>>["sections"]; hasCustom: boolean }
  > = {};

  for (const { pageKey } of BUILDER_PAGES) {
    initialPages[pageKey] = await loadPageSectionsForAdmin(pageKey);
  }

  return (
    <div className="space-y-2">
      <h1 className="font-serif text-2xl text-brand-primary tracking-wide">Site builder</h1>
      <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
        Visual editor for storefront pages. Save updates the live site (no separate publish step required).
        Hidden or deleted sections stay off the site — defaults only apply before you save custom content.
      </p>
      <SiteBuilderEditor initialPages={initialPages} />
    </div>
  );
}
