export const SECTION_TYPES = [
  "hero",
  "text_section",
  "image_text_split",
  "card_grid",
  "quote",
  "cta",
  "stats",
  "timeline",
  "newsletter_signup",
  "featured_posts",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export type ListItem = {
  id: string;
  text: string;
  visible: boolean;
  sortOrder: number;
  metadata?: Record<string, unknown>;
};

export type PageSection = {
  id: string;
  pageKey: string;
  sectionKey: string;
  sectionType: SectionType;
  label: string;
  visible: boolean;
  sortOrder: number;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
};

export const BUILDER_PAGES = [
  { pageKey: "home", label: "Home", path: "/" },
  { pageKey: "about", label: "About", path: "/about" },
  { pageKey: "mission", label: "Mission", path: "/mission" },
  { pageKey: "partner", label: "Partner", path: "/partner" },
  { pageKey: "give", label: "Give", path: "/give" },
  { pageKey: "merch", label: "Merch", path: "/merch" },
  { pageKey: "blog", label: "Blog", path: "/blog" },
  { pageKey: "contact", label: "Contact", path: "/contact" },
  { pageKey: "global", label: "Global (nav & footer)", path: "" },
] as const;

export type BuilderPageKey = (typeof BUILDER_PAGES)[number]["pageKey"];

export const PAGE_REVALIDATE_PATHS: Record<string, string[]> = {
  home: ["/"],
  about: ["/about"],
  mission: ["/mission"],
  partner: ["/partner"],
  give: ["/give"],
  merch: ["/merch"],
  blog: ["/blog"],
  contact: ["/contact"],
  global: ["/", "/community"],
};
