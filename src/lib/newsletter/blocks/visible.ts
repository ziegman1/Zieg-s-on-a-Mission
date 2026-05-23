import type { NewsletterBlock, NewsletterBlocks } from "./types";

function hasText(value: string | undefined | null): boolean {
  return Boolean(value?.trim());
}

/** Blocks with no public content are omitted from render. */
export function isBlockVisible(block: NewsletterBlock): boolean {
  switch (block.type) {
    case "text":
      return hasText(block.content);
    case "image":
      return hasText(block.imageUrl) && hasText(block.alt);
    case "image_text":
      return (
        hasText(block.imageUrl) &&
        hasText(block.alt) &&
        (hasText(block.heading) || hasText(block.body))
      );
    case "button":
      return hasText(block.label) && hasText(block.url);
    case "divider":
      return true;
    case "quote":
      return hasText(block.text);
    case "heading":
      return hasText(block.text);
    case "spacer":
      return true;
    default:
      return false;
  }
}

export function visibleNewsletterBlocks(blocks: NewsletterBlocks): NewsletterBlocks {
  return blocks.filter(isBlockVisible);
}

export function hasVisibleNewsletterContent(
  body: string,
  bodyBlocks: NewsletterBlocks,
): boolean {
  if (visibleNewsletterBlocks(bodyBlocks).length > 0) return true;
  return body.trim().length > 0;
}
