import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/mission-hub/weekly-digest-delivery", () => ({
  deliverWeeklyMissionHubDigest: vi.fn(),
}));

import { deliverWeeklyMissionHubDigest } from "@/lib/mission-hub/weekly-digest-delivery";
import {
  WEEKLY_DIGEST_CRON_SCHEDULE_UTC,
  isMissionHubWeeklyDigestCronEnabled,
  runScheduledWeeklyDigestCron,
} from "@/lib/mission-hub/weekly-digest-cron";
import type { WeeklyMissionHubDigest } from "@/lib/mission-hub/weekly-digest-core";

const digestWithContent: WeeklyMissionHubDigest = {
  prepared: true,
  deliveryEnabled: false,
  dateRange: { start: "2026-06-03T12:00:00.000Z", end: "2026-06-10T12:00:00.000Z" },
  sections: [],
  totals: {
    prayerRequests: 1,
    praiseReports: 0,
    encouragementPosts: 0,
    ministryUpdates: 0,
    blogArticles: 0,
    resources: 0,
    newsletters: 0,
    comments: 0,
    voicePrayers: 0,
    reactions: 0,
    publishedPosts: 1,
  },
  hasContent: true,
  digestEmailRecipientsPrepared: 2,
};

const emptyDigest: WeeklyMissionHubDigest = {
  ...digestWithContent,
  hasContent: false,
  totals: { ...digestWithContent.totals, prayerRequests: 0, publishedPosts: 0 },
};

function deliveryResult(
  digest: WeeklyMissionHubDigest,
  overrides: Partial<Awaited<ReturnType<typeof deliverWeeklyMissionHubDigest>>> = {},
) {
  return {
    digest,
    emailEnabled: true,
    emailDisabledReason: null,
    eligibleRecipients: 2,
    sent: 2,
    deduped: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    ...overrides,
  };
}

describe("WEEKLY_DIGEST_CRON_SCHEDULE_UTC", () => {
  it("runs Saturday morning at 12:00 UTC (same time as former Friday schedule)", () => {
    expect(WEEKLY_DIGEST_CRON_SCHEDULE_UTC).toBe("0 12 * * 6");
  });
});

describe("runScheduledWeeklyDigestCron", () => {
  const originalFlag = process.env.MISSION_HUB_WEEKLY_DIGEST_CRON_ENABLED;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MISSION_HUB_WEEKLY_DIGEST_CRON_ENABLED = "true";
    vi.mocked(deliverWeeklyMissionHubDigest).mockResolvedValue(
      deliveryResult(digestWithContent),
    );
  });

  afterEach(() => {
    if (originalFlag === undefined) delete process.env.MISSION_HUB_WEEKLY_DIGEST_CRON_ENABLED;
    else process.env.MISSION_HUB_WEEKLY_DIGEST_CRON_ENABLED = originalFlag;
  });

  it("skips when cron feature flag is off", async () => {
    process.env.MISSION_HUB_WEEKLY_DIGEST_CRON_ENABLED = "false";

    const result = await runScheduledWeeklyDigestCron();

    expect(result.status).toBe("skipped");
    if (result.status === "skipped") {
      expect(result.skipReason).toBe("cron_disabled");
    }
    expect(deliverWeeklyMissionHubDigest).not.toHaveBeenCalled();
  });

  it("isMissionHubWeeklyDigestCronEnabled reflects env", () => {
    process.env.MISSION_HUB_WEEKLY_DIGEST_CRON_ENABLED = "true";
    expect(isMissionHubWeeklyDigestCronEnabled()).toBe(true);
    process.env.MISSION_HUB_WEEKLY_DIGEST_CRON_ENABLED = "false";
    expect(isMissionHubWeeklyDigestCronEnabled()).toBe(false);
  });

  it("skips when email notifications are disabled", async () => {
    vi.mocked(deliverWeeklyMissionHubDigest).mockResolvedValue(
      deliveryResult(digestWithContent, {
        emailEnabled: false,
        emailDisabledReason:
          "Mission Hub email notifications are disabled (ENABLE_MISSION_HUB_EMAIL_NOTIFICATIONS).",
        sent: 0,
      }),
    );

    const result = await runScheduledWeeklyDigestCron();

    expect(result.status).toBe("skipped");
    if (result.status === "skipped") {
      expect(result.skipReason).toBe("email_disabled");
    }
    expect(result.sent).toBe(0);
  });

  it("skips when digest has no content", async () => {
    vi.mocked(deliverWeeklyMissionHubDigest).mockResolvedValue(
      deliveryResult(emptyDigest, { sent: 0 }),
    );

    const result = await runScheduledWeeklyDigestCron();

    expect(result.status).toBe("skipped");
    if (result.status === "skipped") {
      expect(result.skipReason).toBe("no_content");
    }
    expect(result.hasContent).toBe(false);
  });

  it("calls member broadcast delivery when enabled", async () => {
    const result = await runScheduledWeeklyDigestCron();

    expect(deliverWeeklyMissionHubDigest).toHaveBeenCalledWith({ broadcastToMembers: true });
    expect(result.status).toBe("completed");
    expect(result.sent).toBe(2);
    expect(result.dateRange.start).toBe(digestWithContent.dateRange.start);
  });

  it("reports deduped recipients on duplicate cron run", async () => {
    vi.mocked(deliverWeeklyMissionHubDigest).mockResolvedValue(
      deliveryResult(digestWithContent, { sent: 0, deduped: 2 }),
    );

    const result = await runScheduledWeeklyDigestCron();

    expect(result.status).toBe("completed");
    expect(result.sent).toBe(0);
    expect(result.deduped).toBe(2);
  });
});
