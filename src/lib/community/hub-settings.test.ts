import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseUpdateHubSettingsInput } from "./settings-types";
import { upsertCommunityHubSettings } from "./hub-settings";

const WELCOME_POST_PATH =
  "/community/start-here#post-9d28934d-c2c5-44f4-af87-2df5a789807c";

vi.mock("@/lib/db", () => ({
  prisma: {
    communityHubSettingsRecord: {
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";

describe("upsertCommunityHubSettings", () => {
  beforeEach(() => {
    vi.mocked(prisma.communityHubSettingsRecord.upsert).mockResolvedValue({} as never);
  });

  it("persists welcomePostPath when production null fields are normalized first", async () => {
    const parsed = parseUpdateHubSettingsInput({
      title: null,
      tagline: null,
      logoUrl: null,
      coverImageUrl: null,
      welcomeText: null,
      invitationTitle: "Join Us in God's Mission",
      invitationBody: "We believe every follower of Jesus has a role to play.",
      welcomePostPath: WELCOME_POST_PATH,
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    await upsertCommunityHubSettings(parsed.data);

    expect(prisma.communityHubSettingsRecord.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          welcomePostPath: WELCOME_POST_PATH,
          title: null,
          logoUrl: null,
        }),
      }),
    );
  });

  it("persists welcomePostPath when logo placeholder was submitted", async () => {
    const parsed = parseUpdateHubSettingsInput({
      title: "Mission Hub",
      tagline: "Ministry family",
      logoUrl: "https://…",
      coverImageUrl: null,
      welcomeText: "",
      invitationTitle: "Join Us in God's Mission",
      invitationBody: "We believe every follower of Jesus has a role to play.",
      welcomePostPath: WELCOME_POST_PATH,
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    await upsertCommunityHubSettings(parsed.data);

    expect(prisma.communityHubSettingsRecord.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          welcomePostPath: WELCOME_POST_PATH,
          logoUrl: null,
        }),
      }),
    );
  });
});
