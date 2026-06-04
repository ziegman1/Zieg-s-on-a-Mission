/** Shared secret for Vercel Cron and manual cron invocations. */
export function getCronSecret(): string | null {
  const secret = process.env.CRON_SECRET?.trim();
  return secret || null;
}

export type CronAuthFailureReason = "missing_config" | "invalid_secret";

export type CronAuthResult =
  | { authorized: true }
  | { authorized: false; reason: CronAuthFailureReason };

/** Verify `Authorization: Bearer <CRON_SECRET>`. */
export function authorizeCronRequest(request: Pick<Request, "headers">): CronAuthResult {
  const secret = getCronSecret();
  if (!secret) {
    return { authorized: false, reason: "missing_config" };
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return { authorized: false, reason: "invalid_secret" };
  }

  return { authorized: true };
}
