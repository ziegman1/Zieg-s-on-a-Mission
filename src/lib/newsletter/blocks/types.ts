export const NEWSLETTER_BLOCK_TYPES = [
  "text",
  "image",
  "image_text",
  "button",
  "document",
  "divider",
  "quote",
  "heading",
  "spacer",
] as const;

export type NewsletterBlockType = (typeof NEWSLETTER_BLOCK_TYPES)[number];

export type ImagePosition = "left" | "right" | "top";
export type ButtonAlign = "left" | "center" | "right";
export type HeadingLevel = "h2" | "h3";
export type SpacerSize = "small" | "medium" | "large";

type BlockBase<T extends NewsletterBlockType> = {
  id: string;
  type: T;
};

export type TextBlock = BlockBase<"text"> & { content: string };
export type ImageBlock = BlockBase<"image"> & {
  imageUrl: string;
  alt: string;
  caption: string;
};
export type ImageTextBlock = BlockBase<"image_text"> & {
  imageUrl: string;
  alt: string;
  heading: string;
  body: string;
  buttonLabel: string;
  buttonUrl: string;
  buttonAlign: ButtonAlign;
  imagePosition: ImagePosition;
};
export type ButtonBlock = BlockBase<"button"> & {
  label: string;
  url: string;
  align: ButtonAlign;
};
export type DocumentBlock = BlockBase<"document"> & {
  documentUrl: string;
  title: string;
  description: string;
  buttonLabel: string;
  align: ButtonAlign;
};
export type DividerBlock = BlockBase<"divider">;
export type QuoteBlock = BlockBase<"quote"> & {
  text: string;
  attribution: string;
};
export type HeadingBlock = BlockBase<"heading"> & {
  text: string;
  level: HeadingLevel;
};
export type SpacerBlock = BlockBase<"spacer"> & { size: SpacerSize };

export type NewsletterBlock =
  | TextBlock
  | ImageBlock
  | ImageTextBlock
  | ButtonBlock
  | DocumentBlock
  | DividerBlock
  | QuoteBlock
  | HeadingBlock
  | SpacerBlock;

export type NewsletterBlocks = NewsletterBlock[];
