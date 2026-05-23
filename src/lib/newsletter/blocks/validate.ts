import type { NewsletterBlocks } from "./types";
import { hasVisibleNewsletterContent, isBlockVisible } from "./visible";

export function isValidOptionalUrl(url: string): boolean {
  const t = url.trim();
  if (!t) return true;
  if (t.startsWith("/")) return true;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidRequiredUrl(url: string): boolean {
  const t = url.trim();
  if (!t) return false;
  return isValidOptionalUrl(t);
}

export type BlockValidationIssue = { blockId: string; message: string };

export function validateNewsletterBlocks(
  blocks: NewsletterBlocks,
  intent: "draft" | "publish",
): BlockValidationIssue[] {
  const issues: BlockValidationIssue[] = [];

  for (const block of blocks) {
    if (!isBlockVisible(block) && intent === "draft") continue;

    switch (block.type) {
      case "image":
        if (block.imageUrl.trim() && !block.alt.trim()) {
          issues.push({ blockId: block.id, message: "Image blocks require alt text." });
        }
        if (block.imageUrl.trim() && !isValidOptionalUrl(block.imageUrl)) {
          issues.push({ blockId: block.id, message: "Image URL must be http(s) or a site path." });
        }
        break;
      case "image_text":
        if (block.imageUrl.trim() && !block.alt.trim()) {
          issues.push({ blockId: block.id, message: "Image + text blocks require alt text." });
        }
        if (block.buttonLabel.trim() || block.buttonUrl.trim()) {
          if (!block.buttonLabel.trim() || !block.buttonUrl.trim()) {
            issues.push({
              blockId: block.id,
              message: "Button label and URL are both required.",
            });
          } else if (!isValidRequiredUrl(block.buttonUrl)) {
            issues.push({ blockId: block.id, message: "Button URL is invalid." });
          }
        }
        if (block.imageUrl.trim() && !isValidOptionalUrl(block.imageUrl)) {
          issues.push({ blockId: block.id, message: "Image URL is invalid." });
        }
        break;
      case "button":
        if (block.label.trim() || block.url.trim()) {
          if (!block.label.trim() || !block.url.trim()) {
            issues.push({
              blockId: block.id,
              message: "Button blocks require label and URL.",
            });
          } else if (!isValidRequiredUrl(block.url)) {
            issues.push({ blockId: block.id, message: "Button URL is invalid." });
          }
        }
        break;
      default:
        break;
    }
  }

  return issues;
}

export function assertNewsletterContent(
  body: string,
  bodyBlocks: NewsletterBlocks,
  intent: "draft" | "publish",
): void {
  const blockIssues = validateNewsletterBlocks(bodyBlocks, intent);
  if (blockIssues.length > 0) {
    throw new Error(blockIssues[0]!.message);
  }

  if (intent === "publish" && !hasVisibleNewsletterContent(body, bodyBlocks)) {
    throw new Error("Add at least one content block before publishing.");
  }

  if (intent === "publish" && body.trim() && bodyBlocks.length === 0) {
    return;
  }
}
