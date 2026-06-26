export const SECTION_TYPES = [
  "hero",
  "text_section",
  "image_text_split",
  "card_grid",
  "quote",
  "cta",
  "stats",
  "mission_counter",
  "timeline",
  "newsletter_signup",
  "featured_posts",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

import type { ElementStyle } from "./element-types";

export type ListItem = {
  id: string;
  text: string;
  visible: boolean;
  sortOrder: number;
  metadata?: Record<string, unknown>;
  style?: ElementStyle;
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
  {
    pageKey: "partner",
    label: "Partner",
    path: "/partner",
    group: "Get Involved",
  },
  {
    pageKey: "advocacy-team",
    label: "Advocacy Team",
    path: "/advocacy-team",
    group: "Get Involved",
  },
  { pageKey: "give", label: "Give", path: "/give" },
  { pageKey: "merch", label: "Merch", path: "/merch" },
  { pageKey: "blog", label: "Blog", path: "/blog" },
  { pageKey: "community", label: "Community", path: "/community" },
  { pageKey: "contact", label: "Contact", path: "/contact" },
  { pageKey: "global", label: "Global (nav & footer)", path: "" },
] as const;

export type BuilderPageDef = (typeof BUILDER_PAGES)[number];

export type BuilderPageKey = (typeof BUILDER_PAGES)[number]["pageKey"];

export const PAGE_REVALIDATE_PATHS: Record<string, string[]> = {
  home: ["/"],
  about: ["/about"],
  mission: ["/mission"],
  partner: ["/partner"],
  "advocacy-team": ["/advocacy-team"],
  give: ["/give"],
  merch: ["/merch"],
  blog: ["/blog"],
  community: ["/community"],
  contact: ["/contact"],
  global: ["/", "/community", "/partner", "/advocacy-team", "/give"],
  newsletters: ["/newsletters"],
};

/** Site builder nav — Newsletter Builder (separate from page sections). */
export const NEWSLETTER_BUILDER_NAV = {
  id: "newsletters",
  label: "Newsletters",
} as const;
