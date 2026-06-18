import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { CAMPAIGN_GIVING_URL } from "@/data/support-campaign-config";
import { openCampaignGivingPage } from "./open-giving-page";

describe("openCampaignGivingPage", () => {
  const assignMock = vi.fn();

  beforeEach(() => {
    assignMock.mockReset();
    vi.stubGlobal("window", {
      location: { assign: assignMock },
      open: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("navigates the current tab to the Aplos giving URL", () => {
    openCampaignGivingPage();

    expect(assignMock).toHaveBeenCalledWith(CAMPAIGN_GIVING_URL);
  });

  it("does not open a new tab or about:blank", () => {
    openCampaignGivingPage();

    expect(window.open).not.toHaveBeenCalled();
  });
});
