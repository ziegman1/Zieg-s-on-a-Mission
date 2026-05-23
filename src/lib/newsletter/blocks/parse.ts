import { NEWSLETTER_BLOCK_TYPES, type NewsletterBlock, type NewsletterBlocks } from "./types";

function isBlockType(value: unknown): value is NewsletterBlock["type"] {
  return (
    typeof value === "string" &&
    (NEWSLETTER_BLOCK_TYPES as readonly string[]).includes(value)
  );
}

function parseOne(raw: unknown): NewsletterBlock | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id.trim() || !isBlockType(o.type)) return null;

  const id = o.id.trim();
  const str = (k: string) => (typeof o[k] === "string" ? o[k] : "");

  switch (o.type) {
    case "text":
      return { id, type: "text", content: str("content") };
    case "image":
      return {
        id,
        type: "image",
        imageUrl: str("imageUrl"),
        alt: str("alt"),
        caption: str("caption"),
      };
    case "image_text": {
      const pos = str("imagePosition");
      const imagePosition =
        pos === "right" || pos === "top" || pos === "left" ? pos : "left";
      const btnAlign = str("buttonAlign");
      const buttonAlign =
        btnAlign === "left" || btnAlign === "right" ? btnAlign : "center";
      return {
        id,
        type: "image_text",
        imageUrl: str("imageUrl"),
        alt: str("alt"),
        heading: str("heading"),
        body: str("body"),
        buttonLabel: str("buttonLabel"),
        buttonUrl: str("buttonUrl"),
        buttonAlign,
        imagePosition,
      };
    }
    case "button": {
      const align = str("align");
      return {
        id,
        type: "button",
        label: str("label"),
        url: str("url"),
        align: align === "left" || align === "right" ? align : "center",
      };
    }
    case "document": {
      const align = str("align");
      return {
        id,
        type: "document",
        documentUrl: str("documentUrl"),
        title: str("title"),
        description: str("description"),
        buttonLabel: str("buttonLabel") || "Download PDF",
        align: align === "left" || align === "right" ? align : "center",
      };
    }
    case "divider":
      return { id, type: "divider" };
    case "quote":
      return { id, type: "quote", text: str("text"), attribution: str("attribution") };
    case "heading": {
      const level = str("level") === "h3" ? "h3" : "h2";
      return { id, type: "heading", text: str("text"), level };
    }
    case "spacer": {
      const size = str("size");
      const s = size === "small" || size === "large" ? size : "medium";
      return { id, type: "spacer", size: s };
    }
    default:
      return null;
  }
}

/** Parse stored JSON; invalid entries are dropped. */
export function parseNewsletterBlocks(raw: unknown): NewsletterBlocks {
  if (!Array.isArray(raw)) return [];
  const out: NewsletterBlock[] = [];
  for (const item of raw) {
    const block = parseOne(item);
    if (block) out.push(block);
  }
  return out;
}
