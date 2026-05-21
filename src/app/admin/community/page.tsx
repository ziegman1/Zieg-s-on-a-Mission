import { listAllCommunitySpacesForAdmin } from "@/lib/community/spaces";
import { CommunitySpacesManager } from "./community-spaces-manager";

export const dynamic = "force-dynamic";

export default async function AdminCommunityPage() {
  let spaces: Awaited<ReturnType<typeof listAllCommunitySpacesForAdmin>> = [];
  let dbError: string | null = null;

  try {
    spaces = await listAllCommunitySpacesForAdmin();
  } catch (e) {
    console.error(e);
    dbError =
      "Could not load community spaces. Run `npx prisma migrate deploy` (or `db:migrate`) against your Supabase database.";
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-brand-primary tracking-wide">Mission Hub — Spaces</h1>
      {dbError ? (
        <p className="text-red-400 text-sm max-w-2xl leading-relaxed">{dbError}</p>
      ) : (
        <CommunitySpacesManager initialSpaces={spaces} />
      )}
    </div>
  );
}
