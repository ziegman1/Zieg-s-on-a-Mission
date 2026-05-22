import type { ElementStyle } from "./element-types";
import { ELEMENT_STYLES_KEY } from "./element-types";
import type { ListItem } from "./types";
import { isElementVisible } from "./element-style-utils";

export function getElementStyles(content: Record<string, unknown>): Record<string, ElementStyle> {
  const raw = content[ELEMENT_STYLES_KEY];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as Record<string, ElementStyle>;
}

export function getFieldStyle(content: Record<string, unknown>, elementId: string): ElementStyle | undefined {
  return getElementStyles(content)[elementId];
}

export function sortedListItems(
  raw: unknown,
  opts?: { includeHidden?: boolean },
): ListItem[] {
  if (!Array.isArray(raw)) return [];
  const items = raw
    .filter(
      (x): x is ListItem =>
        Boolean(x) &&
        typeof x === "object" &&
        typeof (x as ListItem).text === "string" &&
        typeof (x as ListItem).visible === "boolean",
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (opts?.includeHidden) return items;
  return items.filter((x) => x.visible);
}

export function visibleListItems(raw: unknown): ListItem[] {
  return sortedListItems(raw)
    .filter((x) => x.visible && isElementVisible(x.style, true))
    .filter((x) => x.text.trim().length > 0 || hasCardBody(x));
}

function hasCardBody(item: ListItem): boolean {
  const body = item.metadata?.body;
  return typeof body === "string" && body.trim().length > 0;
}

export function contentStr(content: Record<string, unknown>, key: string): string {
  const v = content[key];
  return typeof v === "string" ? v : "";
}

export function fieldVisible(content: Record<string, unknown>, elementId: string): boolean {
  const style = getFieldStyle(content, elementId);
  return isElementVisible(style, true);
}

export function newListItem(sortOrder: number): ListItem {
  return {
    id: `ln_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`,
    text: "",
    visible: true,
    sortOrder,
    style: {},
  };
}
