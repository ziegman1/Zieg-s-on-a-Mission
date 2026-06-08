import {
  buildFormattedContentHtml,
  escapeHtml,
  looksLikeHtml,
  plainTextToHtml,
  sanitizeSiteBuilderHtml,
} from "./formatted-content";

/** Prepare stored content for the rich text editor surface. */
export function prepareRichTextForEditor(stored: string): string {
  const trimmed = stored.trim();
  if (!trimmed) return "";
  return buildFormattedContentHtml(trimmed);
}

/** Normalize editor HTML for safe storage. */
export function normalizeRichTextForStorage(editorHtml: string): string {
  const trimmed = editorHtml
    .replace(/\u00a0/g, " ")
    .replace(/^(<br\s*\/?>|\s)+|(<br\s*\/?>|\s)+$/gi, "")
    .trim();

  if (!trimmed || trimmed === "<br>") return "";

  return sanitizeSiteBuilderHtml(trimmed);
}

/** Normalize inline rich text (titles, short labels with emphasis). */
export function normalizeInlineRichTextForStorage(editorHtml: string): string {
  const sanitized = normalizeRichTextForStorage(editorHtml);
  if (!sanitized) return "";

  if (!looksLikeHtml(sanitized)) return sanitized;

  return sanitized
    .replace(/<\/?(p|div|h[1-6]|ul|ol|li|blockquote)\b[^>]*>/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function prepareInlineRichTextForEditor(stored: string): string {
  const trimmed = stored.trim();
  if (!trimmed) return "";
  if (looksLikeHtml(trimmed)) return sanitizeSiteBuilderHtml(trimmed);
  return escapeHtml(trimmed);
}

export function plainTextToRichTextStorage(text: string): string {
  return normalizeRichTextForStorage(plainTextToHtml(text));
}

/** Render-safe inline HTML for titles and bullet lines. */
export function buildInlineFormattedHtml(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  return normalizeInlineRichTextForStorage(buildFormattedContentHtml(trimmed));
}
