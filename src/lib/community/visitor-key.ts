import { cookies } from "next/headers";
import {
  isValidVisitorKey,
  MISSION_HUB_VISITOR_COOKIE,
  visitorCookieOptions,
} from "@/lib/community/visitor-cookie";

export { MISSION_HUB_VISITOR_COOKIE, isValidVisitorKey } from "@/lib/community/visitor-cookie";

/**
 * Read visitor_key only — safe in Server Components (pages, loaders).
 * Cookie is created in src/proxy.ts on /community routes when missing.
 */
export async function getVisitorKey(): Promise<string | undefined> {
  const jar = await cookies();
  const existing = jar.get(MISSION_HUB_VISITOR_COOKIE)?.value;
  return isValidVisitorKey(existing) ? existing : undefined;
}

/**
 * Returns visitor_key and sets the cookie if missing.
 * Use only in Server Actions or Route Handlers (Next.js forbids cookie writes during RSC render).
 */
export async function getOrSetVisitorKey(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(MISSION_HUB_VISITOR_COOKIE)?.value;
  if (isValidVisitorKey(existing)) return existing;

  const key = crypto.randomUUID();
  jar.set(MISSION_HUB_VISITOR_COOKIE, key, visitorCookieOptions);
  return key;
}
