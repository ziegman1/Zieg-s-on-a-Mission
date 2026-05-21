import { listMembersForAdmin } from "@/lib/community/members";
import { AdminCommunityMembersManager } from "@/components/community/admin-community-members-manager";

export const dynamic = "force-dynamic";

export default async function AdminCommunityMembersPage() {
  let members: Awaited<ReturnType<typeof listMembersForAdmin>> = [];
  let dbError: string | null = null;

  try {
    members = await listMembersForAdmin();
  } catch (e) {
    console.error(e);
    dbError =
      "Could not load members. Run `npm run db:migrate:deploy` after applying the community_members migration.";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-brand-primary tracking-wide">
          Mission Hub — Members
        </h1>
        <p className="text-zinc-400 text-sm mt-2 max-w-2xl">
          Visitor profiles created to comment on posts. Blocked members cannot post new comments
          (enforced on the server).
        </p>
      </div>
      {dbError ? (
        <p className="text-red-400 text-sm max-w-2xl leading-relaxed">{dbError}</p>
      ) : (
        <AdminCommunityMembersManager initialMembers={members} />
      )}
    </div>
  );
}
