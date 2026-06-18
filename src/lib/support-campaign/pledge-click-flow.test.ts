import { describe, expect, it, vi } from "vitest";
import { runSupportCampaignPledgeClick } from "./pledge-click-flow";

describe("runSupportCampaignPledgeClick", () => {
  it("prepares giving page before awaiting the pledge action", async () => {
    const order: string[] = [];
    const prepared = { closed: false, close: vi.fn() } as unknown as Window;
    const prepareGivingPage = vi.fn(() => {
      order.push("prepareGivingPage");
      return prepared;
    });
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
      prepareGivingPage,
      onRecorded,
      refresh,
      openGivingPage,
      delayMs: 0,
    });

    expect(result).toEqual({ ok: true, pledgedAmount: 500 });
    expect(order).toEqual([
      "prepareGivingPage",
      "addPledge",
      "onRecorded",
      "refresh",
      "openGivingPage",
    ]);
    expect(openGivingPage).toHaveBeenCalledWith(prepared);
    expect(prepareGivingPage).toHaveBeenCalledBefore(addPledge);
  });

  it("closes prepared tab and does not open giving page when pledge fails", async () => {
    const prepared = { closed: false, close: vi.fn() } as unknown as Window;
    const openGivingPage = vi.fn();
    const addPledge = vi.fn(async () => ({
      ok: false as const,
      error: "nope",
    }));

    const result = await runSupportCampaignPledgeClick(100, {
      addPledge,
      prepareGivingPage: () => prepared,
      refresh: vi.fn(),
      openGivingPage,
    });

    expect(result).toEqual({ ok: false, error: "nope" });
    expect(prepared.close).toHaveBeenCalledOnce();
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
      refresh: vi.fn(),
      openGivingPage,
      delayMs: 0,
    });
    await runSupportCampaignPledgeClick(250, {
      addPledge,
      refresh: vi.fn(),
      openGivingPage,
      delayMs: 0,
    });

    expect(addPledge).toHaveBeenCalledTimes(2);
    expect(addPledge).toHaveBeenNthCalledWith(1, 100);
    expect(addPledge).toHaveBeenNthCalledWith(2, 250);
    expect(openGivingPage).toHaveBeenCalledTimes(2);
    expect(pledged).toBe(450);
  });
});
