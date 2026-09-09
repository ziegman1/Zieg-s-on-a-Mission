import { redirect } from "next/navigation";
import type { RecruitRecord } from "@prisma/client";
import { requireAdminOnlySession } from "@/lib/admin-auth";
import { getRecruitCounts, listRecruits } from "@/lib/recruits/recruits-db";
import type { RecruitCounts } from "@/lib/recruits/recruit-milestones";
import { RecruitsManager } from "./recruits-manager";
import { RecruitSummary } from "./recruit-summary";

export const dynamic = "force-dynamic";

export default async function AdminRecruitsPage() {
  // The shared admin layout admits STAFF, so this page enforces ADMIN-only access itself.
  const admin = await requireAdminOnlySession();
  if (!admin) redirect("/admin");

  let recruits: RecruitRecord[] = [];
  let counts: RecruitCounts = { mobilized: 0, trained: 0, sent: 0 };
  let dbError: string | null = null;

  try {
    [recruits, counts] = await Promise.all([listRecruits(), getRecruitCounts()]);
  } catch (e) {
    console.error(e);
    dbError =
      "Could not load recruits. Run `npm run db:migrate:deploy` against your Supabase database.";
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-brand-primary tracking-wide">Recruit Tracker</h1>
        <p className="text-zinc-400 text-sm mt-2 max-w-3xl leading-relaxed">
          Every recruit added here counts as Mobilized. Check Jonathan Training and Fully Funded as
          each person reaches those milestones — the public progress numbers are calculated from
          these records automatically. Enter a couple as one record using &ldquo;and&rdquo; or &ldquo;&amp;&rdquo;
          (for example &ldquo;Jeremy and Lindsay Ziegenhorn&rdquo;) and they will count as two
          people.
        </p>
      </div>

      {dbError ? (
        <p className="text-red-400 text-sm max-w-2xl leading-relaxed">{dbError}</p>
      ) : (
        <>
          <RecruitSummary counts={counts} />
          <RecruitsManager initialRecruits={recruits} />
        </>
      )}
    </div>
  );
}
