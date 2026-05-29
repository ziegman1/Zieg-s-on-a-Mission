export const SITE_COPY_PAYLOAD_VERSION = 2 as const;

export const BLOCK_TYPES = [
  "text",
  "textarea",
  "rich_text",
  "heading",
  "subheading",
  "bullet_list",
  "quote",
  "cta",
  "image",
  "stat",
  "structured_list",
  "nav_link",
  "custom_json",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export type ContentLine = {
  id: string;
  text: string;
  visible: boolean;
  sortOrder: number;
  metadata?: Record<string, unknown>;
};

export type ContentBlock = {
  id: string;
  pageKey: string;
  sectionKey: string;
  blockKey: string;
  blockType: BlockType;
  label: string;
  value: string;
  lines: ContentLine[];
  visible: boolean;
  sortOrder: number;
  metadata: Record<string, unknown>;
};

export type SiteCopyBlocksPayload = {
  version: typeof SITE_COPY_PAYLOAD_VERSION;
  blocks: ContentBlock[];
};

export type PageTab = {
  pageKey: string;
  label: string;
  description?: string;
};

export const SITE_COPY_PAGE_TABS: PageTab[] = [
  { pageKey: "global", label: "Global", description: "Site name, header nav (Get Involved, Give Now), footer, support email" },
  { pageKey: "home", label: "Home", description: "Hero, guided sections, pathway cards" },
  { pageKey: "about", label: "About" },
  { pageKey: "mission", label: "Mission" },
  { pageKey: "blog", label: "Blog" },
  { pageKey: "contact", label: "Contact" },
  { pageKey: "partner", label: "Partner" },
  { pageKey: "give", label: "Give" },
  { pageKey: "merch", label: "Merch" },
];
