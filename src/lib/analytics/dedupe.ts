import { PAGE_VIEW_DEDUPE_MS } from "./constants";

/**
 * Pure page-view dedupe key helper (client + tests).
 * Same session + path within the window counts as a duplicate.
 */
export function isDuplicatePageView(params: {
  sessionId: string;
  path: string;
  previous?: { sessionId: string; path: string; at: number } | null;
  now?: number;
  windowMs?: number;
}): boolean {
  const now = params.now ?? Date.now();
  const windowMs = params.windowMs ?? PAGE_VIEW_DEDUPE_MS;
  const prev = params.previous;
  if (!prev) return false;
  if (prev.sessionId !== params.sessionId) return false;
  if (prev.path !== params.path) return false;
  return now - prev.at < windowMs;
}

/** In-memory legacy (no-session) dedupe for short windows — best-effort per instance. */
const legacyHits = new Map<string, number>();

export function shouldRecordLegacyPageView(params: {
  visitorKey: string;
  path: string;
  now?: number;
  windowMs?: number;
}): boolean {
  const now = params.now ?? Date.now();
  const windowMs = params.windowMs ?? PAGE_VIEW_DEDUPE_MS;
  const key = `${params.visitorKey}|${params.path}`;
  const prev = legacyHits.get(key);
  if (prev != null && now - prev < windowMs) return false;
  legacyHits.set(key, now);
  if (legacyHits.size > 2_000) {
    for (const [k, t] of legacyHits) {
      if (now - t > windowMs) legacyHits.delete(k);
    }
  }
  return true;
}

export function resetLegacyPageViewDedupeForTests(): void {
  legacyHits.clear();
}
