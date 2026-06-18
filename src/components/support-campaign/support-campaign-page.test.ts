import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("support campaign pledge page client flow", () => {
  it("awaits pledge flow before redirecting to Aplos in the same tab", () => {
    const page = readFileSync(
      resolve(process.cwd(), "src/components/support-campaign/support-campaign-page.tsx"),
      "utf8",
    );
    const openGivingPage = readFileSync(
      resolve(process.cwd(), "src/lib/support-campaign/open-giving-page.ts"),
      "utf8",
    );
    const pledgeFlow = readFileSync(
      resolve(process.cwd(), "src/lib/support-campaign/pledge-click-flow.ts"),
      "utf8",
    );

    expect(page).toContain("runSupportCampaignPledgeClick");
    expect(page).toContain("await runSupportCampaignPledgeClick");
    expect(page).not.toContain("startTransition");
    expect(page).not.toContain("useRouter");
    expect(page).not.toContain("router.refresh");
    expect(page).not.toContain("prepareCampaignGivingPage");
    expect(page).not.toContain("about:blank");
    expect(page).not.toContain("finally");
    expect(page).toContain("openCampaignGivingPage");
    expect(page).toContain("disabled={pledgePending}");
    expect(page).toContain("Recording your pledge selection");
    expect(page).toContain("Opening secure giving page");
    expect(openGivingPage).toContain("window.location.assign");
    expect(openGivingPage).not.toContain("window.open");
    expect(pledgeFlow).not.toContain("refresh");
    expect(pledgeFlow).not.toContain("delayMs");
  });
});
