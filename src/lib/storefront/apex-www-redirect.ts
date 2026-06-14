import { LEGAL_CONFIG } from "@/data/legal-config";

/** Apex host without www (from site config). */
export function getApexHostname(): string {
  try {
    return new URL(LEGAL_CONFIG.siteUrl).hostname.toLowerCase();
  } catch {
    return "ziegsonamission.com";
  }
}

export function getWwwHostname(): string {
  return `www.${getApexHostname()}`;
}

/** Cron routes must stay on the requested host so Vercel Cron is not blocked by redirects. */
export function isCronApiPath(pathname: string): boolean {
  return pathname === "/api/cron" || pathname.startsWith("/api/cron/");
}

export function shouldBypassApexToWwwRedirect(pathname: string): boolean {
  return isCronApiPath(pathname);
}

function isLocalOrPreviewHost(host: string): boolean {
  return (
    host === "localhost" ||
    host.endsWith(".vercel.app") ||
    host.endsWith(".vercel.sh") ||
    host.endsWith(".local")
  );
}

/**
 * Whether an apex-host request should redirect to www.
 * Returns false for cron paths, www, localhost, and Vercel preview hosts.
 */
export function shouldRedirectApexToWww(
  host: string | null | undefined,
  pathname: string,
): boolean {
  if (shouldBypassApexToWwwRedirect(pathname)) return false;

  const normalized = host?.split(":")[0]?.trim().toLowerCase();
  if (!normalized) return false;
  if (isLocalOrPreviewHost(normalized)) return false;
  if (normalized === getWwwHostname()) return false;

  return normalized === getApexHostname();
}

/** Build the www URL preserving path, query, and protocol. */
export function buildWwwRedirectUrl(url: URL): URL {
  const redirect = new URL(url.toString());
  redirect.protocol = "https:";
  redirect.host = getWwwHostname();
  return redirect;
}
