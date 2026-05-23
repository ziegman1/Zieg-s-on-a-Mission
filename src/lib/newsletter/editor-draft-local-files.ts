import { BLOCK_TYPE_LABELS } from "@/lib/newsletter/blocks/factory";
import { parseNewsletterBlocks } from "@/lib/newsletter/blocks/parse";
import type { NewsletterBlock, NewsletterBlocks } from "@/lib/newsletter/blocks/types";
import { isUnhostedPdfReference, normalizeNewsletterLinkUrl } from "@/lib/newsletter/cta-url";
import type { NewsletterEditorDraftForm } from "./editor-draft";

export type RecoveredDraftLocalFileIssue = {
  blockId: string;
  blockType: NewsletterBlock["type"];
  field: string;
  removedValue: string;
  label: string;
};

export type SanitizeRecoveredDraftResult = {
  form: NewsletterEditorDraftForm;
  removed: RecoveredDraftLocalFileIssue[];
  hadInvalid: boolean;
};

/** file://, OS paths, backslashes, bare PDFs, or bare image filenames — not hosted https URLs. */
export function isInvalidLocalFileReference(value: string): boolean {
  const t = normalizeNewsletterLinkUrl(value);
  if (!t) return false;
  if (isUnhostedPdfReference(t)) return true;
  if (/^[^/\\]+\.(png|jpe?g|webp|gif)$/i.test(t)) return true;
  return false;
}

function issueLabel(block: NewsletterBlock, field: string): string {
  const typeLabel = BLOCK_TYPE_LABELS[block.type];
  if (block.type === "document") {
    const title = block.title.trim();
    return title ? `${typeLabel}: “${title}”` : typeLabel;
  }
  if (block.type === "button" && block.label.trim()) {
    return `${typeLabel}: “${block.label.trim()}”`;
  }
  return `${typeLabel} (${field})`;
}

function scanBlocks(blocks: NewsletterBlocks): RecoveredDraftLocalFileIssue[] {
  const issues: RecoveredDraftLocalFileIssue[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case "document":
        if (isInvalidLocalFileReference(block.documentUrl)) {
          issues.push({
            blockId: block.id,
            blockType: block.type,
            field: "documentUrl",
            removedValue: block.documentUrl,
            label: issueLabel(block, "documentUrl"),
          });
        }
        break;
      case "button":
        if (isInvalidLocalFileReference(block.url)) {
          issues.push({
            blockId: block.id,
            blockType: block.type,
            field: "url",
            removedValue: block.url,
            label: issueLabel(block, "url"),
          });
        }
        break;
      case "image_text":
        if (isInvalidLocalFileReference(block.imageUrl)) {
          issues.push({
            blockId: block.id,
            blockType: block.type,
            field: "imageUrl",
            removedValue: block.imageUrl,
            label: issueLabel(block, "imageUrl"),
          });
        }
        if (isInvalidLocalFileReference(block.buttonUrl)) {
          issues.push({
            blockId: block.id,
            blockType: block.type,
            field: "buttonUrl",
            removedValue: block.buttonUrl,
            label: issueLabel(block, "buttonUrl"),
          });
        }
        break;
      case "image":
        if (isInvalidLocalFileReference(block.imageUrl)) {
          issues.push({
            blockId: block.id,
            blockType: block.type,
            field: "imageUrl",
            removedValue: block.imageUrl,
            label: issueLabel(block, "imageUrl"),
          });
        }
        break;
      default:
        break;
    }
  }

  return issues;
}

function scanFormMeta(form: NewsletterEditorDraftForm): RecoveredDraftLocalFileIssue[] {
  const issues: RecoveredDraftLocalFileIssue[] = [];
  const metaFields: { field: keyof NewsletterEditorDraftForm; label: string }[] = [
    { field: "ctaUrl", label: "Issue CTA URL" },
    { field: "headerImageUrl", label: "Header image" },
    { field: "featuredImageUrl", label: "Featured image" },
    { field: "footerImageUrl", label: "Footer image" },
  ];

  for (const { field, label } of metaFields) {
    const value = String(form[field] ?? "");
    if (isInvalidLocalFileReference(value)) {
      issues.push({
        blockId: "issue",
        blockType: "button",
        field,
        removedValue: value,
        label,
      });
    }
  }

  return issues;
}

export function findLocalFileReferencesInEditorForm(
  form: NewsletterEditorDraftForm,
): RecoveredDraftLocalFileIssue[] {
  const blocks = parseNewsletterBlocks(form.bodyBlocks);
  return [...scanFormMeta(form), ...scanBlocks(blocks)];
}

function clearBlockField(block: NewsletterBlock, field: string): NewsletterBlock {
  switch (block.type) {
    case "document":
      if (field === "documentUrl") return { ...block, documentUrl: "" };
      break;
    case "button":
      if (field === "url") return { ...block, url: "" };
      break;
    case "image_text":
      if (field === "imageUrl") return { ...block, imageUrl: "" };
      if (field === "buttonUrl") return { ...block, buttonUrl: "" };
      break;
    case "image":
      if (field === "imageUrl") return { ...block, imageUrl: "" };
      break;
    default:
      break;
  }
  return block;
}

function sanitizeBlocks(blocks: NewsletterBlocks, issues: RecoveredDraftLocalFileIssue[]): NewsletterBlocks {
  const byBlock = new Map<string, RecoveredDraftLocalFileIssue[]>();
  for (const issue of issues) {
    if (issue.blockId === "issue") continue;
    const list = byBlock.get(issue.blockId) ?? [];
    list.push(issue);
    byBlock.set(issue.blockId, list);
  }

  return blocks.map((block) => {
    const blockIssues = byBlock.get(block.id);
    if (!blockIssues?.length) return block;
    return blockIssues.reduce((b, issue) => clearBlockField(b, issue.field), block);
  });
}

function sanitizeFormMeta(
  form: NewsletterEditorDraftForm,
  issues: RecoveredDraftLocalFileIssue[],
): NewsletterEditorDraftForm {
  let next = { ...form };
  for (const issue of issues) {
    if (issue.blockId !== "issue") continue;
    if (issue.field === "ctaUrl") next = { ...next, ctaUrl: "" };
    if (issue.field === "headerImageUrl") next = { ...next, headerImageUrl: "" };
    if (issue.field === "featuredImageUrl") next = { ...next, featuredImageUrl: "" };
    if (issue.field === "footerImageUrl") next = { ...next, footerImageUrl: "" };
  }
  return next;
}

/** Strip file:// and other local file references; keep other block fields. */
export function sanitizeRecoveredDraftForm(
  form: NewsletterEditorDraftForm,
): SanitizeRecoveredDraftResult {
  const blocks = parseNewsletterBlocks(form.bodyBlocks);
  const removed = [...scanFormMeta(form), ...scanBlocks(blocks)];
  if (removed.length === 0) {
    return { form: { ...form, bodyBlocks: blocks }, removed: [], hadInvalid: false };
  }

  const sanitizedBlocks = sanitizeBlocks(blocks, removed);
  let sanitizedForm: NewsletterEditorDraftForm = {
    ...form,
    bodyBlocks: sanitizedBlocks,
  };
  sanitizedForm = sanitizeFormMeta(sanitizedForm, removed);

  return {
    form: sanitizedForm,
    removed,
    hadInvalid: true,
  };
}

export function formatRecoveredDraftLocalFileWarning(issues: RecoveredDraftLocalFileIssue[]): string {
  if (issues.length === 0) return "";
  const labels = [...new Set(issues.map((i) => i.label))];
  if (labels.length === 1) {
    return `Recovered draft contained a local file link in ${labels[0]}. Upload the file again or use a public https:// URL.`;
  }
  return `Recovered draft contained local file links in: ${labels.join("; ")}. Re-upload those files or use public https:// URLs.`;
}

export const BLOCKING_LOCAL_FILE_SAVE_MESSAGE =
  "Remove local file links before saving. Upload PDFs/images or paste a public https:// URL.";

export function hasBlockingLocalFileReferences(form: NewsletterEditorDraftForm): boolean {
  return findLocalFileReferencesInEditorForm(form).length > 0;
}

/** Clear invalid URLs in the current form without touching other fields. */
export function clearLocalFileReferencesFromForm(
  form: NewsletterEditorDraftForm,
): NewsletterEditorDraftForm {
  return sanitizeRecoveredDraftForm(form).form;
}
