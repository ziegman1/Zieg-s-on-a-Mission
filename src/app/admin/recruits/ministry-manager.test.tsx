import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import { MinistryManager } from "./ministry-manager";
import { MinistrySummary } from "./ministry-summary";

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
            activities: [],
          },
        ]}
      />,
    );
    expect(html).toContain("Search people");
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("Team Expansion Recruits");
    expect(html).not.toContain("Onboard, then raise support");
  });
});
