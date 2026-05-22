export type ElementStyle = {
  visible?: boolean;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  shadow?: "none" | "sm" | "md" | "lg";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  spacing?: "tight" | "normal" | "loose";
  columnSpan?: 1 | 2 | 3;
  alignment?: "left" | "center" | "right";
  fontSize?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
  fontWeight?: "normal" | "medium" | "semibold" | "bold";
  fontStyle?: "normal" | "italic";
  headingLevel?: "h1" | "h2" | "h3" | "h4" | "p";
  maxWidth?: "narrow" | "normal" | "wide" | "full";
  objectFit?: "cover" | "contain";
  imagePosition?: "left" | "right" | "top" | "bottom";
  buttonVariant?: "default" | "outline" | "ghost" | "accent";
  buttonSize?: "sm" | "md" | "lg";
};

export type ContentElement = {
  id: string;
  type: "heading" | "paragraph" | "quote" | "note";
  text: string;
  visible: boolean;
  sortOrder: number;
  style?: ElementStyle;
  metadata?: Record<string, unknown>;
};

export type BuilderElementType =
  | "text"
  | "card"
  | "button"
  | "image"
  | "list_item"
  | "quote"
  | "custom";

export type BuilderSelection = {
  sectionId: string;
  elementId: string;
  elementType: BuilderElementType;
  label: string;
};

export const ELEMENT_STYLES_KEY = "elementStyles";
