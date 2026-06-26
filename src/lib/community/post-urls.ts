/** Detect and split http(s) URLs in Mission Hub post body text. */

const HTTP_URL_IN_TEXT_REGEX =
  /https?:\/\/(?:[^\s<>"'`]*[^\s<>"'`.,;:!?)}\]'"]|[^\s<>"'`.,;:!?)}\]'"])/gi;

export type LinkTextSegment =
  | { kind: "text"; value: string }
  | { kind: "url"; href: string; display: string };

function stripTrailingUrlPunctuation(raw: string): string {
  let value = raw;
  while (value.length > 0) {
    const last = value.at(-1);
    if (!last) break;

    if (last === ")") {
      const openCount = (value.match(/\(/g) ?? []).length;
      const closeCount = (value.match(/\)/g) ?? []).length;
      if (closeCount > openCount) {
        value = value.slice(0, -1);
        continue;
      }
      break;
    }

    if (/[.,;:!?}\]'"]/.test(last)) {
      value = value.slice(0, -1);
      continue;
    }

    break;
  }

  return value;
}

export function normalizeDetectedHttpUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;

  const cleaned = stripTrailingUrlPunctuation(trimmed);
  if (!cleaned) return null;

  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (!parsed.hostname) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function extractHttpUrlsFromText(text: string): string[] {
  const matches = text.match(HTTP_URL_IN_TEXT_REGEX) ?? [];
  const seen = new Set<string>();
  const urls: string[] = [];

  for (const match of matches) {
    const normalized = normalizeDetectedHttpUrl(match);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    urls.push(normalized);
  }

  return urls;
}

/** When the body contains exactly one http(s) URL, return it for link previews. */
export function getSingleWebpageUrlInText(text: string): string | null {
  const urls = extractHttpUrlsFromText(text);
  return urls.length === 1 ? urls[0] : null;
}

export function splitTextIntoLinkSegments(text: string): LinkTextSegment[] {
  if (!text) return [];

  const segments: LinkTextSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(HTTP_URL_IN_TEXT_REGEX)) {
    const raw = match[0];
    const index = match.index ?? 0;
    const normalized = normalizeDetectedHttpUrl(raw);

    if (!normalized) continue;

    if (index > lastIndex) {
      segments.push({ kind: "text", value: text.slice(lastIndex, index) });
    }

    segments.push({ kind: "url", href: normalized, display: raw });
    lastIndex = index + raw.length;
  }

  if (lastIndex < text.length) {
    segments.push({ kind: "text", value: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ kind: "text", value: text }];
}
