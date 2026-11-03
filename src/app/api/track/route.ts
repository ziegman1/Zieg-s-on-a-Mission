/**
 * First-party storefront analytics ingest.
 * Accepts legacy `{ path }` and enhanced `{ sessionId, events[] }` payloads.
 * Never trusts client-submitted traffic classifications.
 */

import { NextResponse } from "next/server";
import { ingestAnalyticsRequest } from "@/lib/analytics/ingest";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await ingestAnalyticsRequest(req, body);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }
  } catch {
    // Fail silently for legacy callers — don't break the site
  }
  return NextResponse.json({ ok: true });
}
