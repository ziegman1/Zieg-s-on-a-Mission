import { listAllCommentsForAdmin } from "@/lib/community/comments";
import { AdminCommunityCommentsManager } from "@/components/community/admin-community-comments-manager";

export const dynamic = "force-dynamic";

export default async function AdminCommunityCommentsPage() {
  let comments: Awaited<ReturnType<typeof listAllCommentsForAdmin>> = [];
  let dbError: string | null = null;

  try {
    comments = await listAllCommentsForAdmin();
  } catch (e) {
    console.error(e);
    dbError =
      "Could not load comments. Run `npm run db:migrate:deploy` after applying the community_post_comments migration.";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-brand-primary tracking-wide">
          Mission Hub — Comments
        </h1>
        <p className="text-zinc-400 text-sm mt-2 max-w-2xl">
          Moderate visitor comments on published posts. Hide removes them from the public feed; archive
          keeps them out of the storefront while retaining history here.
        </p>
      </div>
      {dbError ? (
        <p className="text-red-400 text-sm max-w-2xl leading-relaxed">{dbError}</p>
      ) : (
        <AdminCommunityCommentsManager initialComments={comments} />
      )}
    </div>
  );
}
