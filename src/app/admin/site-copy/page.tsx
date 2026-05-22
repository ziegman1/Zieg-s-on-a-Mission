import { getSiteCopyBlocksForAdmin } from "@/lib/site-copy";
import { FlexibleSiteCopyEditor } from "./flexible-site-copy-editor";

export default async function AdminSiteCopyPage() {
  const blocks = await getSiteCopyBlocksForAdmin();

  return (
    <div>
      <h1 className="font-serif text-2xl text-brand-primary tracking-wide mb-2">Site copy</h1>
      <p className="text-sm text-zinc-400 mb-8 max-w-2xl leading-relaxed">
        Flexible content blocks for every page and section. Hide, reorder, add, or remove copy
        without redeploying. Saving writes version 2 blocks to the database and refreshes cached
        pages.
      </p>
      <FlexibleSiteCopyEditor initialBlocks={blocks} />
    </div>
  );
}
