import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import { MinistrySummary } from "./ministry-summary";
import { NationalPartnerInitiatives } from "./national-partner-initiatives";

describe("national partner initiative admin section", () => {
  it("lists an initiative and its equal milestone contribution", () => {
    const html = renderToStaticMarkup(
      <NationalPartnerInitiatives
        counts={{ mobilized: 40, trainedEquipped: 40, sent: 40 }}
        audits={[]}
        initiatives={[
          {
            id: "initiative-1",
            nation: "Kenya",
            area: "Rift Valley",
            trainingType: "FOUR_FIELDS",
            completedCount: 40,
          },
        ]}
      />,
    );
    expect(html).toContain("National Partner Training Initiatives");
    expect(html).toContain("Add Initiative");
    expect(html).toContain("cannot be identified");
    expect(html).toContain("Kenya");
    expect(html).toContain("Rift Valley");
    expect(html).toContain("Four Fields");
    expect(html).toContain("40 completed");
    expect(html).toContain("Mobilized 40");
    expect(html).toContain("Sent 40");
    expect(html).not.toContain("Four Fields Online");
    expect(html).not.toContain("type=\"email\"");
  });

  it("shows unified totals separately from individual and initiative counts", () => {
    const html = renderToStaticMarkup(
      <MinistrySummary
        counts={{
          individuals: { mobilized: 8, trainedEquipped: 6, sent: 6 },
          nationalPartnerInitiatives: { mobilized: 40, trainedEquipped: 40, sent: 40 },
          unified: { mobilized: 48, trainedEquipped: 46, sent: 46 },
        }}
      />,
    );
    expect(html).toContain(">48<");
    expect(html).toContain(">46<");
    expect(html).toContain("8 verified individuals");
    expect(html).toContain("40 national partner participants");
    expect(html).toContain("not on the public site");
  });

  it("uses one save action inside the initiative modal", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/admin/recruits/national-partner-initiatives.tsx"),
      "utf8",
    );
    expect(source).toContain("Save Changes");
    expect(source).toContain("Discard unsaved changes to this initiative?");
    expect(source).toContain("Remove this initiative?");
    expect(source).not.toContain("FOUR_FIELDS_ONLINE");
    expect(source).not.toContain("email");
  });
});
