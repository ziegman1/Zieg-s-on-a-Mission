import "server-only";

import { normalizeDetectedHttpUrl } from "@/lib/community/post-urls";

export type LinkPreviewMetadata = {
  url: string;
  hostname: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
};

const FETCH_TIMEOUT_MS = 8_000;
const MAX_HTML_BYTES = 512_000;
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
  "metadata.google.internal",
]);

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCharCode(parseInt(dec, 10)));
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;

  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

export function isSafeLinkPreviewUrl(rawUrl: string): boolean {
  const normalized = normalizeDetectedHttpUrl(rawUrl);
  if (!normalized) return false;

  try {
    const parsed = new URL(normalized);
    const hostname = parsed.hostname.toLowerCase();

    if (BLOCKED_HOSTNAMES.has(hostname)) return false;
    if (hostname.endsWith(".local") || hostname.endsWith(".internal")) return false;
    if (isPrivateIpv4(hostname)) return false;

    return true;
  } catch {
    return false;
  }
}

function readMetaContent(html: string, key: string): string | null {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    const value = match?.[1]?.trim();
    if (value) return decodeHtmlEntities(value);
  }

  return null;
}

function readDocumentTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const value = match?.[1]?.replace(/\s+/g, " ").trim();
  return value ? decodeHtmlEntities(value) : null;
}

function resolvePreviewImageUrl(rawImage: string | null, pageUrl: string): string | null {
  if (!rawImage?.trim()) return null;

  try {
    return new URL(rawImage.trim(), pageUrl).toString();
  } catch {
    return null;
  }
}

export function parseOpenGraphFromHtml(html: string, pageUrl: string): LinkPreviewMetadata {
  const parsedPageUrl = new URL(pageUrl);
  const title =
    readMetaContent(html, "og:title") ??
    readMetaContent(html, "twitter:title") ??
    readDocumentTitle(html);
  const description =
    readMetaContent(html, "og:description") ??
    readMetaContent(html, "twitter:description") ??
    readMetaContent(html, "description");
  const imageUrl = resolvePreviewImageUrl(
    readMetaContent(html, "og:image") ?? readMetaContent(html, "twitter:image"),
    pageUrl,
  );

  return {
    url: pageUrl,
    hostname: parsedPageUrl.hostname.replace(/^www\./i, ""),
    title: title?.trim() || null,
    description: description?.trim() || null,
    imageUrl,
  };
}

export async function fetchLinkPreviewMetadata(
  rawUrl: string,
): Promise<LinkPreviewMetadata | null> {
  const url = normalizeDetectedHttpUrl(rawUrl);
  if (!url || !isSafeLinkPreviewUrl(url)) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "User-Agent": "MissionHubLinkPreview/1.0 (+https://ziegsonamission.org)",
      },
    });

    if (!response.ok) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_HTML_BYTES) return null;

    const html = buffer.toString("utf8");
    const preview = parseOpenGraphFromHtml(html, response.url || url);

    if (!preview.title && !preview.description && !preview.imageUrl) {
      return {
        ...preview,
        title: preview.hostname,
      };
    }

    return preview;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
