import "server-only";

import { LEGAL_CONFIG } from "@/data/legal-config";

/** Public site origin for Mission Hub notification links. */
export function getMissionHubSiteOrigin(): string {
  const raw =
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    LEGAL_CONFIG.siteUrl;
  return raw.replace(/\/$/, "");
}

export function absoluteMissionHubUrl(path: string): string {
  const base = getMissionHubSiteOrigin();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
