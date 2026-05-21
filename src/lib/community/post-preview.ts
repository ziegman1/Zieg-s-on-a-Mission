/** ~4–5 lines of `text-sm` in a typical feed column. */
export const FEED_BODY_PREVIEW_MAX_CHARS = 320;

/**
 * Word-safe truncation for feed preview when no excerpt is stored.
 * Preserves original whitespace in the returned slice only for the kept portion.
 */
export function truncateBodyForFeedPreview(
  body: string,
  maxChars: number = FEED_BODY_PREVIEW_MAX_CHARS,
): string {
  const trimmed = body.trim();
  if (trimmed.length <= maxChars) return trimmed;

  const slice = trimmed.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(" ");
  const cut =
    lastSpace > Math.floor(maxChars * 0.55) ? slice.slice(0, lastSpace) : slice.trimEnd();

  return `${cut.trim()}…`;
}

export type CommunityPostBodyPreview = {
  /** Full post body (expanded state). */
  fullBody: string;
  /** Collapsed feed preview: excerpt if set, otherwise truncated body. */
  collapsedPreview: string;
  /** Whether Read more should appear. */
  canExpand: boolean;
};

export function getCommunityPostBodyPreview(
  body: string,
  excerpt: string | null | undefined,
): CommunityPostBodyPreview {
  const fullBody = body.trim();
  const excerptTrimmed = excerpt?.trim() || null;

  if (excerptTrimmed) {
    const canExpand =
      fullBody.length > excerptTrimmed.length ||
      fullBody.replace(/\s+/g, " ") !== excerptTrimmed.replace(/\s+/g, " ");
    return {
      fullBody,
      collapsedPreview: excerptTrimmed,
      canExpand,
    };
  }

  const collapsedPreview = truncateBodyForFeedPreview(fullBody);
  const canExpand =
    fullBody.length > collapsedPreview.replace(/…$/, "").trim().length;

  return { fullBody, collapsedPreview, canExpand };
}
