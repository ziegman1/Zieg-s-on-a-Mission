import { getCommunityAdminStats } from "@/lib/community/admin-community-stats";
import { listAllCommunitySpacesForAdmin } from "@/lib/community/spaces";
import { CommunityAdminDashboard } from "./community-admin-dashboard";
import { CommunitySpacesManager } from "./community-spaces-manager";
import { WeeklyDigestPreviewPanel } from "./weekly-digest-preview-panel";

export const dynamic = "force-dynamic";

export default async function AdminCommunityPage() {
  let spaces: Awaited<ReturnType<typeof listAllCommunitySpacesForAdmin>> = [];
  let stats: Awaited<ReturnType<typeof getCommunityAdminStats>> | null = null;
  let dbError: string | null = null;

  try {
    [spaces, stats] = await Promise.all([
      listAllCommunitySpacesForAdmin(),
      getCommunityAdminStats(),
    ]);
  } catch (e) {
    console.error(e);
    dbError =
      "Could not load community spaces. Run `npx prisma migrate deploy` (or `db:migrate`) against your Supabase database.";
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-brand-primary tracking-wide">Mission Hub</h1>
        <p className="text-zinc-400 text-sm mt-2 max-w-3xl leading-relaxed">
          Manage spaces, posts, comments, and members. Use the tabs above or the cards below.
        </p>
      </div>
      {stats ? <CommunityAdminDashboard stats={stats} /> : null}
      <WeeklyDigestPreviewPanel />
      <div className="space-y-6">
        <h2 className="font-serif text-2xl text-brand-primary tracking-wide">Spaces</h2>
        {dbError ? (
          <p className="text-red-400 text-sm max-w-2xl leading-relaxed">{dbError}</p>
        ) : (
          <CommunitySpacesManager initialSpaces={spaces} />
        )}
      </div>
    </div>
  );
}
