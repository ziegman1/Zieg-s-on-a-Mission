import type { NewsletterBlock, NewsletterBlocks } from "./types";
import { isBlockVisible } from "./visible";

/** Legacy plain `body` field derived from blocks (excerpt fallback, search, Mission Hub). */
export function blocksToPlainBody(blocks: NewsletterBlocks): string {
  const parts: string[] = [];
  for (const block of blocks) {
    if (!isBlockVisible(block)) continue;
    switch (block.type) {
      case "text":
        if (block.content.trim()) parts.push(block.content.trim());
        break;
      case "heading":
        if (block.text.trim()) parts.push(`## ${block.text.trim()}`);
        break;
      case "quote":
        if (block.text.trim()) {
          parts.push(
            block.attribution.trim()
              ? `"${block.text.trim()}" — ${block.attribution.trim()}`
              : `"${block.text.trim()}"`,
          );
        }
        break;
      case "image_text":
        if (block.heading.trim()) parts.push(block.heading.trim());
        if (block.body.trim()) parts.push(block.body.trim());
        break;
      case "button":
        if (block.label.trim()) parts.push(`${block.label.trim()}: ${block.url.trim()}`);
        break;
      default:
        break;
    }
  }
  return parts.join("\n\n");
}

export function resolveNewsletterBody(
  body: string,
  bodyBlocks: NewsletterBlocks,
): string {
  const fromBlocks = blocksToPlainBody(bodyBlocks);
  if (fromBlocks.trim()) return fromBlocks;
  return body;
}
