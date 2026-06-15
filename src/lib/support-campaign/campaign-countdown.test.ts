import { describe, expect, it } from "vitest";
import { CAMPAIGN } from "@/data/support-campaign-config";
import {
  getCampaignCountdown,
  getCampaignDurationMs,
  isCampaignActive,
  padCountdownUnit,
} from "./campaign-countdown";

describe("campaign-countdown", () => {
  it("uses a fixed 7-day campaign window", () => {
    const durationMs = getCampaignDurationMs();
    expect(durationMs).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("shows exactly 7 days at campaign start", () => {
    const start = Date.parse(CAMPAIGN.startDate);
    const state = getCampaignCountdown(start);
    expect(state.active).toBe(true);
    if (state.active) {
      expect(state.remaining).toEqual({
        days: 7,
        hours: 0,
        minutes: 0,
        seconds: 0,
      });
    }
  });

  it("shows full window before campaign start", () => {
    const start = Date.parse(CAMPAIGN.startDate);
    const state = getCampaignCountdown(start - 60_000);
    expect(state.active).toBe(true);
    if (state.active) {
      expect(state.remaining).toEqual({
        days: 7,
        hours: 0,
        minutes: 0,
        seconds: 0,
      });
    }
  });

  it("returns active countdown before end date", () => {
    const end = Date.parse(CAMPAIGN.endDate);
    const now = end - (2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000;
    const state = getCampaignCountdown(now);
    expect(state.active).toBe(true);
    if (state.active) {
      expect(state.remaining).toEqual({
        days: 2,
        hours: 3,
        minutes: 4,
        seconds: 5,
      });
    }
  });

  it("returns inactive at or after end date", () => {
    const end = Date.parse(CAMPAIGN.endDate);
    expect(getCampaignCountdown(end).active).toBe(false);
    expect(getCampaignCountdown(end + 1000).active).toBe(false);
  });

  it("pads countdown units with leading zeros", () => {
    expect(padCountdownUnit(7)).toBe("07");
    expect(padCountdownUnit(0)).toBe("00");
    expect(padCountdownUnit(12)).toBe("12");
  });

  it("never returns negative unit values", () => {
    expect(padCountdownUnit(-1)).toBe("00");
  });

  it("isCampaignActive only between start and end", () => {
    const start = Date.parse(CAMPAIGN.startDate);
    const end = Date.parse(CAMPAIGN.endDate);
    expect(isCampaignActive(start - 1000)).toBe(false);
    expect(isCampaignActive(start)).toBe(true);
    expect(isCampaignActive(end - 1000)).toBe(true);
    expect(isCampaignActive(end)).toBe(false);
  });
});
