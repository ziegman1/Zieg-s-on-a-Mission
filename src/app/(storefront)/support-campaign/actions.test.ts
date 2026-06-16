import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/support-campaign/campaign-state", () => ({
  addSupportCampaignPledge: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { addSupportCampaignPledge } from "@/lib/support-campaign/campaign-state";
import { addCampaignPledgeAction } from "./actions";

describe("addCampaignPledgeAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns updated pledgedAmount and revalidates campaign routes on success", async () => {
    vi.mocked(addSupportCampaignPledge).mockResolvedValueOnce({
      id: "support-campaign-2026",
      goalAmount: 2000,
      pledgedAmount: 350,
      startDate: "2026-06-15T21:50:00.000Z",
      endDate: "2026-06-22T21:50:00.000Z",
      isActive: true,
    });

    const result = await addCampaignPledgeAction(100);

    expect(result).toEqual({ ok: true, pledgedAmount: 350 });
    expect(addSupportCampaignPledge).toHaveBeenCalledWith(100);
    expect(revalidatePath).toHaveBeenCalledWith("/support-campaign");
    expect(revalidatePath).toHaveBeenCalledWith("/campaign");
  });

  it("returns ok: false for invalid amounts without calling the database", async () => {
    const result = await addCampaignPledgeAction(99);

    expect(result).toEqual({ ok: false, error: "Invalid partnership level." });
    expect(addSupportCampaignPledge).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns ok: false when the database increment fails", async () => {
    vi.mocked(addSupportCampaignPledge).mockRejectedValueOnce(new Error("db down"));

    const result = await addCampaignPledgeAction(250);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Could not record");
    }
  });
});
