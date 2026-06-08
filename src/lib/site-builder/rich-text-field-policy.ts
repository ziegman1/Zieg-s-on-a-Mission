/** URL, button label, and identifier fields stay plain text. */
const PLAIN_ONLY_KEYS = new Set(["imageAlt", "slug", "id", "href", "cta"]);

const PLAIN_ONLY_SUFFIXES = ["Label", "Url", "Alt", "Href", "Email"];

export function isPlainTextField(fieldKey: string): boolean {
  if (PLAIN_ONLY_KEYS.has(fieldKey)) return true;
  return PLAIN_ONLY_SUFFIXES.some((suffix) => fieldKey.endsWith(suffix));
}

/** All editable copy fields use the full rich text editor unless explicitly plain-only. */
export function richTextModeForField(
  fieldKey: string,
  _opts?: { multiline?: boolean },
): "plain" | "full" {
  return isPlainTextField(fieldKey) ? "plain" : "full";
}

export function richTextModeForContentElement(elementType: string): "plain" | "full" {
  return "full";
}

export function richTextModeForElementField(
  fieldKey: string,
  opts?: { multiline?: boolean; contentElementType?: string },
): "plain" | "full" {
  void opts;
  return richTextModeForField(fieldKey);
}
