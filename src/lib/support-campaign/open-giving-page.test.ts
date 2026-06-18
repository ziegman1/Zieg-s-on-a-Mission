import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { CAMPAIGN_GIVING_URL } from "@/data/support-campaign-config";
import {
  openCampaignGivingPage,
  prepareCampaignGivingPage,
} from "./open-giving-page";

describe("openCampaignGivingPage", () => {
  const openMock = vi.fn();
  const assignMock = vi.fn();

  beforeEach(() => {
    openMock.mockReset();
    assignMock.mockReset();
    vi.stubGlobal("window", {
      open: openMock,
      location: { assign: assignMock },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("prepareCampaignGivingPage opens a blank tab synchronously", () => {
    const mockWindow = { closed: false } as Window;
    openMock.mockReturnValue(mockWindow);

    const prepared = prepareCampaignGivingPage();

    expect(prepared).toBe(mockWindow);
    expect(openMock).toHaveBeenCalledWith("about:blank", "_blank", "noopener,noreferrer");
  });

  it("navigates a prepared tab to the Aplos giving URL", () => {
    const prepared = {
      closed: false,
      location: { href: "" },
      focus: vi.fn(),
    } as unknown as Window;

    openCampaignGivingPage(prepared);

    expect(prepared.location.href).toBe(CAMPAIGN_GIVING_URL);
    expect(prepared.focus).toHaveBeenCalled();
  });

  it("falls back to location.assign when popup is blocked", () => {
    openMock.mockReturnValue(null);

    openCampaignGivingPage();

    expect(assignMock).toHaveBeenCalledWith(CAMPAIGN_GIVING_URL);
  });
});
