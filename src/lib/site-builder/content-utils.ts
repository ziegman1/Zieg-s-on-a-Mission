import type { ElementStyle } from "./element-types";
import { ELEMENT_STYLES_KEY } from "./element-types";
import type { ListItem } from "./types";
import { isElementVisible } from "./element-style-utils";

export function asContentRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function getElementStyles(content: Record<string, unknown> | undefined): Record<string, ElementStyle> {
  const raw = asContentRecord(content)[ELEMENT_STYLES_KEY];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as Record<string, ElementStyle>;
}

export function getFieldStyle(
  content: Record<string, unknown> | undefined,
  elementId: string,
): ElementStyle | undefined {
  return getElementStyles(content)[elementId];
}

/** Coerce persisted JSON list rows into editable list items (cards, bullets, etc.). */
export function normalizeListItem(raw: unknown, index: number): ListItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id =
    typeof o.id === "string" && o.id.trim().length > 0 ? o.id : `card-${index}`;
  const text =
    typeof o.text === "string"
      ? o.text
      : typeof o.title === "string"
        ? o.title
        : "";
  const visible = typeof o.visible === "boolean" ? o.visible : true;
  const sortOrder = typeof o.sortOrder === "number" ? o.sortOrder : index;
  const metadata =
    o.metadata && typeof o.metadata === "object" && !Array.isArray(o.metadata)
      ? (o.metadata as Record<string, unknown>)
      : undefined;
  const style =
    o.style && typeof o.style === "object" && !Array.isArray(o.style)
      ? (o.style as ElementStyle)
      : undefined;
  return { id, text, visible, sortOrder, metadata, style };
}

export function normalizeListItems(raw: unknown): ListItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, i) => normalizeListItem(item, i))
    .filter((x): x is ListItem => x !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function sortedListItems(
  raw: unknown,
  opts?: { includeHidden?: boolean },
): ListItem[] {
  const items = normalizeListItems(raw);
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

export function contentStr(content: Record<string, unknown> | undefined, key: string): string {
  const v = asContentRecord(content)[key];
  return typeof v === "string" ? v : "";
}

export function fieldVisible(content: Record<string, unknown> | undefined, elementId: string): boolean {
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
