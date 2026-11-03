/**
 * Compact one-line summary for collapsed ministry-function accordion rows.
 * Derived from the authored description — never a second content source.
 */

export function ministryFunctionSummary(description: string, maxLen = 110): string {
  const cleaned = description.trim().replace(/\s+/g, " ");
  if (!cleaned) return "";

  const sentenceMatch = cleaned.match(/^(.+?[.!?])(?:\s|$)/);
  const candidate = (sentenceMatch?.[1] ?? cleaned).trim();
  if (candidate.length <= maxLen) return candidate;

  const slice = candidate.slice(0, Math.max(1, maxLen - 1));
  const lastSpace = slice.lastIndexOf(" ");
  const clipped = (lastSpace > 40 ? slice.slice(0, lastSpace) : slice).trimEnd();
  return `${clipped}…`;
}

/** Toggle a function id in an independent multi-expand set. */
export function toggleExpandedFunctionId(
  openIds: ReadonlySet<string>,
  id: string,
): Set<string> {
  const next = new Set(openIds);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}
