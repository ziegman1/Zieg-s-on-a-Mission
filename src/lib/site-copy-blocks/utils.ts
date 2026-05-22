import type { ContentBlock, ContentLine } from "./types";

export function newBlockId(): string {
  return `blk_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export function newLineId(): string {
  return `ln_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

export function sortBlocks(blocks: ContentBlock[]): ContentBlock[] {
  return [...blocks].sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
}

export function sortLines(lines: ContentLine[]): ContentLine[] {
  return [...lines].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function visibleLines(lines: ContentLine[]): ContentLine[] {
  return sortLines(lines).filter((l) => l.visible && l.text.trim().length > 0);
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

export function reindexLines(lines: ContentLine[]): ContentLine[] {
  return lines.map((l, i) => ({ ...l, sortOrder: i }));
}

export function reindexBlocks(blocks: ContentBlock[]): ContentBlock[] {
  return blocks.map((b, i) => ({ ...b, sortOrder: i }));
}

export function groupBlocksBySection(
  blocks: ContentBlock[],
  pageKey: string,
): Map<string, ContentBlock[]> {
  const map = new Map<string, ContentBlock[]>();
  for (const block of sortBlocks(blocks.filter((b) => b.pageKey === pageKey))) {
    const list = map.get(block.sectionKey) ?? [];
    list.push(block);
    map.set(block.sectionKey, list);
  }
  return map;
}
