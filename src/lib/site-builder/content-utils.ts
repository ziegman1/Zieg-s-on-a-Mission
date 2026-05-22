import type { ListItem } from "./types";

export function visibleListItems(raw: unknown): ListItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (x): x is ListItem =>
        Boolean(x) &&
        typeof x === "object" &&
        typeof (x as ListItem).text === "string" &&
        typeof (x as ListItem).visible === "boolean",
    )
    .filter((x) => x.visible && x.text.trim().length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function contentStr(content: Record<string, unknown>, key: string): string {
  const v = content[key];
  return typeof v === "string" ? v : "";
}

export function newListItem(sortOrder: number): ListItem {
  return {
    id: `ln_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`,
    text: "",
    visible: true,
    sortOrder,
  };
}
