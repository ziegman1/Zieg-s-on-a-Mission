import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js proxy (middleware): sets x-pathname for /admin so layout can treat /admin/login as public.
 * No auth, Prisma, or heavy imports — keeps Edge bundle under size limit.
 */
export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (!path.startsWith("/admin")) return NextResponse.next();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", path);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  // `/admin/:path*` does not match the index route `/admin` — without `/admin`, `x-pathname`
  // was never set and the layout could not treat `/admin/login` as public.
  matcher: ["/admin", "/admin/:path*"],
};
