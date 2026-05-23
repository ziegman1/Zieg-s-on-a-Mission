import type {
  ButtonAlign,
  HeadingLevel,
  ImagePosition,
  NewsletterBlock,
  NewsletterBlockType,
  SpacerSize,
} from "./types";

export function newBlockId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `blk_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createNewsletterBlock(type: NewsletterBlockType): NewsletterBlock {
  const id = newBlockId();
  switch (type) {
    case "text":
      return { id, type: "text", content: "" };
    case "image":
      return { id, type: "image", imageUrl: "", alt: "", caption: "" };
    case "image_text":
      return {
        id,
        type: "image_text",
        imageUrl: "",
        alt: "",
        heading: "",
        body: "",
        buttonLabel: "",
        buttonUrl: "",
        buttonAlign: "center" as ButtonAlign,
        imagePosition: "left" as ImagePosition,
      };
    case "button":
      return { id, type: "button", label: "", url: "", align: "center" as ButtonAlign };
    case "divider":
      return { id, type: "divider" };
    case "quote":
      return { id, type: "quote", text: "", attribution: "" };
    case "heading":
      return { id, type: "heading", text: "", level: "h2" as HeadingLevel };
    case "spacer":
      return { id, type: "spacer", size: "medium" as SpacerSize };
    default:
      return { id, type: "text", content: "" };
  }
}

export const BLOCK_TYPE_LABELS: Record<NewsletterBlockType, string> = {
  text: "Text",
  image: "Image",
  image_text: "Image + text",
  button: "Button",
  divider: "Divider",
  quote: "Quote",
  heading: "Heading",
  spacer: "Spacer",
};
