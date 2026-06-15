import { describe, expect, it } from "vitest";
import {
  addPledgeAmount,
  clearStoredPledges,
  hasPledgedAmount,
  parseStoredCampaignPledges,
  removePledgeAtIndex,
  totalPledgedAmount,
} from "./pledge-storage";

describe("pledge-storage", () => {
  it("sums pledge amounts", () => {
    expect(totalPledgedAmount([25, 50, 100])).toBe(175);
  });

  it("does not double-count the same level without allowDuplicate", () => {
    const first = addPledgeAmount({ pledges: [], updatedAt: "" }, 50);
    const second = addPledgeAmount(first, 50);
    expect(second.pledges).toEqual([50]);
  });

  it("allows duplicate pledges when requested", () => {
    const first = addPledgeAmount({ pledges: [50], updatedAt: "" }, 50, {
      allowDuplicate: true,
    });
    expect(first.pledges).toEqual([50, 50]);
  });

  it("tracks whether an amount was already pledged", () => {
    expect(hasPledgedAmount([25, 50], 50)).toBe(true);
    expect(hasPledgedAmount([25], 50)).toBe(false);
  });

  it("removes a pledge by index", () => {
    const next = removePledgeAtIndex({ pledges: [25, 50, 100], updatedAt: "" }, 1);
    expect(next.pledges).toEqual([25, 100]);
  });

  it("parses stored JSON safely", () => {
    expect(parseStoredCampaignPledges(null).pledges).toEqual([]);
    expect(
      parseStoredCampaignPledges(JSON.stringify({ pledges: [25, "bad", 50] })).pledges,
    ).toEqual([25, 50]);
  });

  it("clears pledges", () => {
    expect(clearStoredPledges().pledges).toEqual([]);
  });
});
