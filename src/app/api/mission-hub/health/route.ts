import { runMissionHubHealthChecks } from "@/lib/mission-hub/health-check";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const report = await runMissionHubHealthChecks();
    const ok =
      report.errors.length === 0 &&
      report.spacesLoaded &&
      report.notificationsLoaded &&
      report.feedLoaded &&
      report.unreadLoaded;

    return Response.json(report, { status: ok ? 200 : 503 });
  } catch (error) {
    return Response.json(
      {
        build: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "unknown",
        spacesLoaded: false,
        notificationsLoaded: false,
        feedLoaded: false,
        unreadLoaded: false,
        prayerRoomLoaded: false,
        blogArticlesLoaded: false,
        refreshSnapshotLoaded: false,
        latestNotificationLoaded: false,
        errors: [
          {
            subsystem: "health-route",
            message: error instanceof Error ? error.message : String(error),
          },
        ],
      },
      { status: 503 },
    );
  }
}
