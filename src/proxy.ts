import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  isValidVisitorKey,
  MISSION_HUB_VISITOR_COOKIE,
  visitorCookieOptions,
} from "@/lib/community/visitor-cookie";
import {
  buildWwwRedirectUrl,
  shouldRedirectApexToWww,
} from "@/lib/storefront/apex-www-redirect";

/**
 * Next.js proxy: apex→www redirect (cron exempt), admin x-pathname header, and Mission Hub
 * visitor cookie (no Prisma/auth).
 */
export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (shouldRedirectApexToWww(req.headers.get("host"), path)) {
    return NextResponse.redirect(buildWwwRedirectUrl(req.nextUrl), 307);
  }

  let response: NextResponse;

  const isMissionHub = path === "/community" || path.startsWith("/community/");
  const needsPathname = path.startsWith("/admin") || isMissionHub;

  if (needsPathname) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", path);
    response = NextResponse.next({ request: { headers: requestHeaders } });
  } else {
    response = NextResponse.next();
  }

  if (isMissionHub) {
    const existing = req.cookies.get(MISSION_HUB_VISITOR_COOKIE)?.value;
    if (!isValidVisitorKey(existing)) {
      response.cookies.set(MISSION_HUB_VISITOR_COOKIE, crypto.randomUUID(), visitorCookieOptions);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Public pages (/newsletters, /shop, …), /api/cron (exempt in logic), admin, and community.
     * Skip Next.js static assets and files with extensions.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
