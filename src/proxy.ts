import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  isValidVisitorKey,
  MISSION_HUB_VISITOR_COOKIE,
  visitorCookieOptions,
} from "@/lib/community/visitor-cookie";

/**
 * Next.js proxy: admin x-pathname header + Mission Hub visitor cookie (no Prisma/auth).
 */
export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
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
  matcher: ["/admin", "/admin/:path*", "/community", "/community/:path*"],
};
