import { authorizeCronRequest } from "@/lib/mission-hub/cron-auth";
import { runScheduledWeeklyDigestCron } from "@/lib/mission-hub/weekly-digest-cron";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.authorized) {
    const message =
      auth.reason === "missing_config"
        ? "CRON_SECRET is not configured."
        : "Invalid or missing cron authorization.";
    return Response.json({ ok: false, error: message }, { status: 401 });
  }

  try {
    const result = await runScheduledWeeklyDigestCron();
    return Response.json(result, { status: 200 });
  } catch (error) {
    console.error("[weekly-digest-cron] route failed:", error);
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Weekly digest cron failed",
      },
      { status: 500 },
    );
  }
}
