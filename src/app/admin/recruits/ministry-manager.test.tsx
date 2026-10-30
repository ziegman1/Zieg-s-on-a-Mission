import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import { ActivityEditor, MinistryManager, RecruitProgression, ministryPersonEditorIsDirty } from "./ministry-manager";
import { MinistrySummary } from "./ministry-summary";

const cleanEditor = {
  displayName: "Ada Lovelace",
  pathway: "",
  notes: "",
  householdWithPersonId: "",
  legacyRecruitId: "",
  mobilized: false,
  mobilizedOn: "",
  trainedEquipped: false,
  trainedEquippedOn: "",
  sent: false,
  sentOn: "",
  sentDesignation: "",
  sentVerifiedBy: "",
  sentVerificationNote: "",
  jonathanTrainingComplete: false,
  fullyFunded: false,
  activityDirty: false,
};

describe("ministry admin preview", () => {
  it("renders the new totals separately from a legacy zero state", () => {
    const html = renderToStaticMarkup(
      <MinistrySummary counts={{ mobilized: 1, trainedEquipped: 0, sent: 2 }} />,
    );
    expect(html).toContain("New definitions");
    expect(html).toContain("not on the public site");
    expect(html).toContain(">1<");
    expect(html).toContain(">2<");
    expect(html).toContain("300 more workers Sent");
  });

  it("renders an empty people list and the add form", () => {
    const html = renderToStaticMarkup(<MinistryManager people={[]} legacyRecruits={[]} />);
    expect(html).toContain("Add a person");
    expect(html).toContain("does not count them as Mobilized");
    expect(html).toContain("No people in the new tracker yet.");
  });

  it("lists a person without opening the milestone editor", () => {
    const html = renderToStaticMarkup(
      <MinistryManager
        legacyRecruits={[{ id: "11111111-1111-4111-8111-111111111111", name: "Legacy Name" }]}
        people={[
          {
            id: "22222222-2222-4222-8222-222222222222",
            displayName: "Ada Lovelace",
            pathway: "TEAM_EXPANSION_RECRUIT",
            legacyRecruitId: null,
            householdId: null,
            mobilized: false,
            mobilizedOn: null,
            trainedEquipped: false,
            trainedEquippedOn: null,
            sent: false,
            sentOn: null,
            sentDesignation: null,
            sentVerifiedAt: null,
            sentVerifiedBy: "",
            sentVerificationNote: "",
            notes: "",
            jonathanTrainingComplete: false,
            fullyFunded: false,
            milestoneAudit: "",
            activities: [],
          },
        ]}
      />,
    );
    expect(html).toContain("Search people");
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("Manage");
    expect(html).toContain("Team Expansion Recruits");
    expect(html).not.toContain("Onboard, then raise support");
    expect(html).not.toContain("Save profile");
    expect(html).not.toContain("Save milestones");
    expect(html).not.toContain("Save Changes");
  });

  it("shows Team Expansion Recruit progression without independent milestone checkboxes", () => {
    const html = renderToStaticMarkup(
      <RecruitProgression
        personId="person-1"
        mobilizedOn=""
        onMobilizedOn={() => undefined}
        jonathanTrainingComplete={false}
        onJonathanTrainingComplete={() => undefined}
        fullyFunded={true}
        onFullyFunded={() => undefined}
        trainedEquippedOn="2019-04-04"
        onTrainedEquippedOn={() => undefined}
        sentOn=""
        onSentOn={() => undefined}
        trained={false}
        sent={false}
        trainingEvidence={[
          {
            id: "activity-1",
            activityType: "JONATHAN_TRAINING",
            status: "COMPLETED",
            activityOn: "2018-01-01",
            location: "Emerald Hills",
            notes: "",
          },
        ]}
      />,
    );
    expect(html).toContain("Jonathan Training Complete");
    expect(html).toContain("Fully Funded");
    expect(html).toContain("Mobilized");
    expect(html).toContain("Trained &amp; Equipped");
    expect(html).toContain("Sent");
    expect(html).toContain("Historical Jonathan Training activities");
    expect(html).toContain("Emerald Hills");
    expect(html).not.toContain("Save profile");
    expect(html).not.toContain("Save milestones");
  });

  it("lists Launch in the program menu and shows a saved Launch activity", () => {
    const blank = {
      activityType: "JONATHAN_TRAINING" as const,
      status: "PARTICIPATED" as const,
      activityOn: "",
      location: "",
      notes: "",
    };
    const html = renderToStaticMarkup(
      <ActivityEditor
        activities={[
          {
            id: "activity-launch",
            activityType: "LAUNCH",
            status: "COMPLETED",
            activityOn: "2026-04-01",
            location: "Emerald Hills",
            notes: "departure notes",
          },
        ]}
        removedActivityIds={[]}
        newActivity={blank}
        onNewActivity={() => undefined}
        editingActivityId={null}
        activityEdit={blank}
        onActivityEdit={() => undefined}
        onEdit={() => undefined}
        onCancelEdit={() => undefined}
        onRemove={() => undefined}
        onUndoRemove={() => undefined}
      />,
    );
    expect(html).toContain('value="LAUNCH"');
    expect(html).toContain(">Launch</option>");
    expect(html).toContain("Jonathan Training (DMM)");
    expect(html).toContain("Medical Training");
    expect(html).toContain("Support Raising / Coaching");
    expect(html).toContain("D-Course");
    expect(html).toContain("Zúme");
    expect(html).toContain("Four Fields Online");
    expect(html).toContain("Fidelis");
    expect(html).toContain(">Other</option>");
    expect(html).toContain("Launch ");
    expect(html).toContain("Emerald Hills");
    expect(html).toContain("departure notes");
  });

  it("treats an unchanged editor as clean and any field edit as dirty", () => {
    expect(ministryPersonEditorIsDirty(cleanEditor, cleanEditor)).toBe(false);
    expect(
      ministryPersonEditorIsDirty(cleanEditor, { ...cleanEditor, displayName: "Ada King" }),
    ).toBe(true);
    expect(ministryPersonEditorIsDirty(cleanEditor, { ...cleanEditor, sent: true })).toBe(true);
    expect(
      ministryPersonEditorIsDirty(cleanEditor, { ...cleanEditor, activityDirty: true }),
    ).toBe(true);
  });
});
