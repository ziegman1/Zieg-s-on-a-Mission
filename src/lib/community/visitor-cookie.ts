/** Shared visitor cookie config (safe for middleware + server code). */

export const MISSION_HUB_VISITOR_COOKIE = "mh_visitor";

export const VISITOR_KEY_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidVisitorKey(value: string | undefined): value is string {
  return Boolean(value && VISITOR_KEY_UUID_RE.test(value));
}

export const visitorCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};
