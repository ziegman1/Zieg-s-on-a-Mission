/**
 * Regional analytics privacy status + consent recording.
 * Country is derived server-side only (Vercel geo or ANALYTICS_GEO_COUNTRY_OVERRIDE).
 * Client-supplied country fields are ignored.
 */

import { NextResponse } from "next/server";
import {
  ANALYTICS_CONSENT_COOKIE,
  analyticsConsentCookieOptions,
  consentCookieFromRequest,
  decideAnalyticsPrivacy,
  isAnalyticsConsentChoice,
} from "@/lib/analytics/consent";
import { isAnalyticsEngagementEnabled } from "@/lib/analytics/engagement-flag";

export const dynamic = "force-dynamic";

function publicPrivacyPayload(req: Request) {
  const decision = decideAnalyticsPrivacy({
    headers: req.headers,
    consentCookie: consentCookieFromRequest(req),
  });
  return {
    regionMode: decision.regionMode,
    consent: decision.consent,
    collectionAllowed: decision.collectionAllowed,
    engagementEnabled: isAnalyticsEngagementEnabled(),
  };
}

export async function GET(req: Request) {
  return NextResponse.json(publicPrivacyPayload(req));
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    choice?: unknown;
    country?: unknown;
    region?: unknown;
  };

  // Explicitly ignore spoofable geography from the client.
  void body.country;
  void body.region;

  if (!isAnalyticsConsentChoice(body.choice)) {
    return NextResponse.json({ ok: false, error: "invalid_choice" }, { status: 400 });
  }

  const decisionBefore = decideAnalyticsPrivacy({
    headers: req.headers,
    consentCookie: consentCookieFromRequest(req),
  });

  // Open regions do not need a consent cookie; still allow recording preference for UX.
  const res = NextResponse.json({
    ok: true,
    regionMode: decisionBefore.regionMode,
    consent: body.choice,
    collectionAllowed:
      decisionBefore.regionMode === "open" ? true : body.choice === "granted",
    engagementEnabled: isAnalyticsEngagementEnabled(),
  });

  res.cookies.set(ANALYTICS_CONSENT_COOKIE, body.choice, analyticsConsentCookieOptions);
  return res;
}
