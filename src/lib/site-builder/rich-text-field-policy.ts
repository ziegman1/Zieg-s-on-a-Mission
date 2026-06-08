/** Fields that must stay plain text (labels, URLs, short titles). */
const PLAIN_TEXT_KEYS = new Set([
  "eyebrow",
  "headline",
  "attribution",
  "imageAlt",
  "primaryCtaLabel",
  "secondaryCtaLabel",
  "tertiaryCtaLabel",
  "ctaLabel",
  "amountLabel",
  "cta",
  "href",
]);

const PLAIN_SUFFIXES = ["Label", "Url", "Alt", "Href", "Email"];

export function shouldUsePlainTextField(fieldKey: string): boolean {
  if (PLAIN_TEXT_KEYS.has(fieldKey)) return true;
  return PLAIN_SUFFIXES.some((suffix) => fieldKey.endsWith(suffix));
}

/** Block-level rich text (paragraphs, lists, headings). */
export function shouldUseRichTextField(fieldKey: string, opts?: { multiline?: boolean }): boolean {
  if (shouldUsePlainTextField(fieldKey)) return false;
  if (opts?.multiline) return true;
  return ["body", "intro", "subheadline", "quote"].includes(fieldKey);
}

/** Inline rich text for short fields that may include emphasis/links. */
export function shouldUseInlineRichTextField(fieldKey: string): boolean {
  if (shouldUsePlainTextField(fieldKey)) return false;
  if (shouldUseRichTextField(fieldKey)) return false;
  return ["subheadline", "headline"].includes(fieldKey);
}

export function richTextModeForField(
  fieldKey: string,
  opts?: { multiline?: boolean },
): "plain" | "full" | "inline" {
  if (shouldUsePlainTextField(fieldKey)) return "plain";
  if (shouldUseRichTextField(fieldKey, opts)) return "full";
  if (shouldUseInlineRichTextField(fieldKey)) return "inline";
  if (opts?.multiline) return "full";
  return "plain";
}

export function richTextModeForContentElement(
  elementType: string,
): "plain" | "full" | "inline" {
  if (elementType === "heading") return "inline";
  if (elementType === "paragraph" || elementType === "quote" || elementType === "note") {
    return "full";
  }
  return "plain";
}

export function richTextModeForElementField(
  fieldKey: string,
  opts?: { multiline?: boolean; contentElementType?: string },
): "plain" | "full" | "inline" {
  if (opts?.contentElementType) {
    return richTextModeForContentElement(opts.contentElementType);
  }
  if (fieldKey === "bullet") return "inline";
  return richTextModeForField(fieldKey, opts);
}
