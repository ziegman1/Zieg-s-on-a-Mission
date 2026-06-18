import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("support campaign pledge page client flow", () => {
  it("awaits pledge flow before opening Aplos and does not use fire-and-forget startTransition", () => {
    const page = readFileSync(
      resolve(process.cwd(), "src/components/support-campaign/support-campaign-page.tsx"),
      "utf8",
    );

    expect(page).toContain("runSupportCampaignPledgeClick");
    expect(page).toContain("await runSupportCampaignPledgeClick");
    expect(page).not.toContain("startTransition");
    expect(page).not.toContain("openGivingPage()");
    expect(page).toContain("prepareCampaignGivingPage");
    expect(page).toContain("openCampaignGivingPage");
    expect(page).toContain("disabled={pledgePending}");
    expect(page).toContain("Recording your pledge selection");
  });
});
