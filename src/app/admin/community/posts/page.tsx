import { listAllCommunityPostsForAdmin } from "@/lib/community/posts";
import { listAllCommunitySpacesForAdmin } from "@/lib/community/spaces";
import { AdminCommunityPostForm } from "../admin-community-post-form";

export const dynamic = "force-dynamic";

export default async function AdminCommunityPostsPage() {
  let spaces: Awaited<ReturnType<typeof listAllCommunitySpacesForAdmin>> = [];
  let posts: Awaited<ReturnType<typeof listAllCommunityPostsForAdmin>> = [];
  let dbError: string | null = null;

  try {
    [spaces, posts] = await Promise.all([
      listAllCommunitySpacesForAdmin(),
      listAllCommunityPostsForAdmin(),
    ]);
  } catch (e) {
    console.error(e);
    dbError =
      "Could not load posts. Run `npx prisma migrate deploy` (or `db:migrate`) to add community_posts.";
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-brand-primary tracking-wide">Mission Hub — Posts</h1>
      {dbError ? (
        <p className="text-red-400 text-sm max-w-2xl leading-relaxed">{dbError}</p>
      ) : (
        <AdminCommunityPostForm spaces={spaces} initialPosts={posts} />
      )}
    </div>
  );
}
