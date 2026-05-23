import {
  isValidNewsletterLinkUrl,
  normalizeNewsletterLinkUrl,
  validateNewsletterLinkUrl,
} from "@/lib/newsletter/cta-url";
import { validateNewsletterDocumentUrl } from "@/lib/newsletter/document-url";
import type { NewsletterBlocks } from "./types";
import { hasVisibleNewsletterContent, isBlockVisible } from "./visible";

/** @deprecated Use isValidNewsletterLinkUrl — kept for existing imports. */
export function isValidOptionalUrl(url: string): boolean {
  return isValidNewsletterLinkUrl(url);
}

export function isValidRequiredUrl(url: string): boolean {
  const t = normalizeNewsletterLinkUrl(url);
  if (!t) return false;
  return isValidNewsletterLinkUrl(t);
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
        if (block.imageUrl.trim()) {
          const imageUrlError = validateNewsletterLinkUrl(block.imageUrl);
          if (imageUrlError) {
            issues.push({ blockId: block.id, message: imageUrlError });
          }
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
          } else {
            const buttonUrlError = validateNewsletterLinkUrl(block.buttonUrl);
            if (buttonUrlError) {
              issues.push({ blockId: block.id, message: buttonUrlError });
            }
          }
        }
        if (block.imageUrl.trim()) {
          const imageUrlError = validateNewsletterLinkUrl(block.imageUrl);
          if (imageUrlError) {
            issues.push({ blockId: block.id, message: imageUrlError });
          }
        }
        break;
      case "document": {
        const hasAny =
          block.documentUrl.trim() ||
          block.title.trim() ||
          block.description.trim() ||
          block.buttonLabel.trim();
        if (!hasAny) break;
        if (!block.documentUrl.trim() || !block.buttonLabel.trim()) {
          issues.push({
            blockId: block.id,
            message: "Document blocks require an uploaded PDF and button label.",
          });
        } else {
          const docError = validateNewsletterDocumentUrl(block.documentUrl);
          if (docError) {
            issues.push({ blockId: block.id, message: docError });
          }
        }
        break;
      }
      case "button":
        if (block.label.trim() || block.url.trim()) {
          if (!block.label.trim() || !block.url.trim()) {
            issues.push({
              blockId: block.id,
              message: "Button blocks require label and URL.",
            });
          } else {
            const urlError = validateNewsletterLinkUrl(block.url);
            if (urlError) {
              issues.push({ blockId: block.id, message: urlError });
            }
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
