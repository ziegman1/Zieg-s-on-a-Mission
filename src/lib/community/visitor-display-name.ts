import { cookies } from "next/headers";

/** Remembers visitor display name for Mission Hub comments (until member auth). */
export const MISSION_HUB_DISPLAY_NAME_COOKIE = "mh_display_name";

const MAX_LENGTH = 80;

export function normalizeDisplayName(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed || trimmed.length > MAX_LENGTH) return null;
  return trimmed;
}

export async function getSavedDisplayName(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(MISSION_HUB_DISPLAY_NAME_COOKIE)?.value;
  if (!value) return null;
  return normalizeDisplayName(decodeURIComponent(value));
}

export async function setSavedDisplayName(displayName: string): Promise<void> {
  const normalized = normalizeDisplayName(displayName);
  if (!normalized) return;
  const jar = await cookies();
  jar.set(MISSION_HUB_DISPLAY_NAME_COOKIE, encodeURIComponent(normalized), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
