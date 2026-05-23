import { normalizeNewsletterLinkUrl } from "@/lib/newsletter/cta-url";
import { isUnhostedPdfReference } from "@/lib/newsletter/pdf-link-url";
import type { ButtonBlock, DocumentBlock } from "./types";

/** Convert a Button block into a Document / PDF block (same block id). */
export function convertButtonBlockToDocument(block: ButtonBlock): DocumentBlock {
  const url = normalizeNewsletterLinkUrl(block.url);
  return {
    id: block.id,
    type: "document",
    documentUrl: url && !isUnhostedPdfReference(url) ? url : "",
    title: "",
    description: "",
    buttonLabel: block.label.trim() || "Download PDF",
    align: block.align,
  };
}
