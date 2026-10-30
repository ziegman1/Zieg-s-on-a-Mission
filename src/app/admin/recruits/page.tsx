import { redirect } from "next/navigation";
import type { RecruitRecord } from "@prisma/client";
import { requireAdminOnlySession } from "@/lib/admin-auth";
import {
  getMinistryOutcomeCounts,
  listMinistryPeople,
  type MinistryPersonView,
} from "@/lib/ministry/ministry-db";
import {
  combineMinistryOutcomes,
  countMinistryOutcomes,
  type MinistryOutcomeBreakdown,
} from "@/lib/ministry/ministry-milestones";
import {
  isMissingNationalPartnerInitiativeTable,
  listNationalPartnerInitiativeAudits,
  listNationalPartnerInitiatives,
} from "@/lib/ministry/national-partner-initiatives-db";
import type {
  NationalPartnerInitiativeAuditView,
  NationalPartnerInitiativeView,
} from "@/lib/ministry/national-partner-initiatives";
import { getRecruitCounts, listRecruits } from "@/lib/recruits/recruits-db";
import type { RecruitCounts } from "@/lib/recruits/recruit-milestones";
import { planLegacyImport } from "@/lib/ministry/legacy-import";
import { listLegacyLinks } from "@/lib/ministry/legacy-import-db";
import type { LegacyLinkView } from "@/lib/ministry/legacy-link";
import { LegacyReconciliation } from "./legacy-reconciliation";
import { MinistryManager } from "./ministry-manager";
import { MinistrySummary } from "./ministry-summary";
import { NationalPartnerInitiatives } from "./national-partner-initiatives";
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
  let people: MinistryPersonView[] = [];
  let ministryCounts: MinistryOutcomeBreakdown = {
    individuals: { mobilized: 0, trainedEquipped: 0, sent: 0 },
    nationalPartnerInitiatives: { mobilized: 0, trainedEquipped: 0, sent: 0 },
    unified: { mobilized: 0, trainedEquipped: 0, sent: 0 },
  };
  let initiatives: NationalPartnerInitiativeView[] = [];
  let initiativeAudits: NationalPartnerInitiativeAuditView[] = [];
  let initiativeError: string | null = null;
  let ministryError: string | null = null;
  let links: LegacyLinkView[] | null = null;
  let linkError: string | null = null;

  try {
    [recruits, counts] = await Promise.all([listRecruits(), getRecruitCounts()]);
  } catch (e) {
    console.error(e);
    dbError =
      "Could not load recruits. Run `npm run db:migrate:deploy` against your Supabase database.";
  }

  if (!dbError) {
    try {
      people = await listMinistryPeople();
    } catch (e) {
      console.error(e);
      ministryError =
        "The Ministry Impact preview is not on this database yet. The legacy tracker below is unchanged.";
    }
  }

  if (!dbError && !ministryError) {
    try {
      [ministryCounts, initiatives, initiativeAudits] = await Promise.all([
        getMinistryOutcomeCounts(),
        listNationalPartnerInitiatives(),
        listNationalPartnerInitiativeAudits(),
      ]);
    } catch (e) {
      if (isMissingNationalPartnerInitiativeTable(e)) {
        ministryCounts = combineMinistryOutcomes(countMinistryOutcomes(people), {
          mobilized: 0,
          trainedEquipped: 0,
          sent: 0,
        });
        initiativeError =
          "National partner training initiatives are not on this database yet. The totals above are verified individuals only.";
      } else {
        console.error(e);
        ministryError =
          "The Ministry Impact preview is not on this database yet. The legacy tracker below is unchanged.";
      }
    }
  }

  if (!dbError && !ministryError) {
    try {
      links = await listLegacyLinks();
    } catch (e) {
      console.error(e);
      linkError =
        "Legacy reconciliation is not on this database yet. No historical rows were imported.";
    }
  }

  const plan = planLegacyImport(
    recruits.map((recruit) => ({
      id: recruit.id,
      name: recruit.name,
      jonathanTrainingComplete: recruit.jonathanTrainingComplete,
      fullyFunded: recruit.fullyFunded,
    })),
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl text-brand-primary tracking-wide">
          Ministry Impact Tracker
        </h1>
        <p className="text-zinc-400 text-sm mt-2 max-w-3xl leading-relaxed">
          Record each person, their pathway, their activities, and the milestones you have
          confirmed. National Partners and Training Participants keep separate milestone
          checkboxes. A Team Expansion Recruit is Mobilized when that pathway is saved, Trained
          &amp; Equipped when Jonathan Training is complete, and Sent when that training and full
          funding are both confirmed. Completed national partner trainings are recorded as
          anonymous participant counts, not as named people. The homepage uses these same totals.
        </p>
      </div>

      {dbError ? (
        <p className="text-red-400 text-sm max-w-2xl leading-relaxed">{dbError}</p>
      ) : ministryError ? (
        <p className="text-amber-200/90 text-sm max-w-2xl leading-relaxed">{ministryError}</p>
      ) : (
        <>
          <MinistrySummary counts={ministryCounts} />
          <MinistryManager
            people={people}
            legacyRecruits={recruits.map((recruit) => ({ id: recruit.id, name: recruit.name }))}
          />
          {initiativeError ? (
            <p className="text-amber-200/90 text-sm max-w-2xl leading-relaxed">{initiativeError}</p>
          ) : (
            <NationalPartnerInitiatives
              initiatives={initiatives}
              audits={initiativeAudits}
              counts={ministryCounts.nationalPartnerInitiatives}
            />
          )}
          <LegacyReconciliation
            plan={plan}
            links={links}
            linkError={linkError}
            people={people.map((person) => ({
              id: person.id,
              displayName: person.displayName,
              mobilized: person.mobilized,
              trainedEquipped: person.trainedEquipped,
              sent: person.sent,
            }))}
          />
        </>
      )}

      {dbError ? null : (
        <section className="space-y-6 border-t border-brand-primary/25 pt-8">
          <div>
            <h2 className="font-serif text-2xl text-brand-primary tracking-wide">
              Legacy Recruit Tracker
            </h2>
            <p className="text-zinc-400 text-sm mt-2 max-w-3xl leading-relaxed">
              These records no longer drive the homepage. Mobilized means every person
              named here, Trained means Jonathan Training, and Sent means trained and fully funded.
              Enter a couple as one record using &ldquo;and&rdquo; or &ldquo;&amp;&rdquo;
              (for example &ldquo;Jeremy and Lindsay Ziegenhorn&rdquo;) and they count as two
              people. Nothing in the new tracker changes these figures.
            </p>
          </div>
          <RecruitSummary counts={counts} />
          <RecruitsManager initialRecruits={recruits} />
        </section>
      )}
    </div>
  );
}
