import { describe, expect, it, vi } from "vitest";
import { runSupportCampaignPledgeClick } from "./pledge-click-flow";

describe("runSupportCampaignPledgeClick", () => {
  it("records pledge, updates UI, then redirects without refresh", async () => {
    const order: string[] = [];
    const addPledge = vi.fn(async () => {
      order.push("addPledge");
      return { ok: true as const, pledgedAmount: 500 };
    });
    const refresh = vi.fn(() => {
      order.push("refresh");
    });
    const openGivingPage = vi.fn(() => {
      order.push("openGivingPage");
    });
    const onRecorded = vi.fn(() => {
      order.push("onRecorded");
    });

    const result = await runSupportCampaignPledgeClick(100, {
      addPledge,
      onRecorded,
      openGivingPage,
    });

    expect(result).toEqual({ ok: true, pledgedAmount: 500 });
    expect(order).toEqual(["addPledge", "onRecorded", "openGivingPage"]);
    expect(refresh).not.toHaveBeenCalled();
    expect(openGivingPage).toHaveBeenCalledOnce();
    expect(openGivingPage).toHaveBeenCalledAfter(onRecorded);
  });

  it("does not redirect when the pledge action fails", async () => {
    const openGivingPage = vi.fn();
    const onRecorded = vi.fn();
    const addPledge = vi.fn(async () => ({
      ok: false as const,
      error: "nope",
    }));

    const result = await runSupportCampaignPledgeClick(100, {
      addPledge,
      onRecorded,
      openGivingPage,
    });

    expect(result).toEqual({ ok: false, error: "nope" });
    expect(onRecorded).not.toHaveBeenCalled();
    expect(openGivingPage).not.toHaveBeenCalled();
  });

  it("allows multiple successful pledges to each complete the flow", async () => {
    let pledged = 100;
    const addPledge = vi.fn(async (amount: number) => {
      pledged += amount;
      return { ok: true as const, pledgedAmount: pledged };
    });
    const openGivingPage = vi.fn();

    await runSupportCampaignPledgeClick(100, {
      addPledge,
      openGivingPage,
    });
    await runSupportCampaignPledgeClick(250, {
      addPledge,
      openGivingPage,
    });

    expect(addPledge).toHaveBeenCalledTimes(2);
    expect(addPledge).toHaveBeenNthCalledWith(1, 100);
    expect(addPledge).toHaveBeenNthCalledWith(2, 250);
    expect(openGivingPage).toHaveBeenCalledTimes(2);
    expect(pledged).toBe(450);
  });
});
