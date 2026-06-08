import type { SectionType } from "./types";

export type SectionFieldDef =
  | { key: string; label: string; kind: "text" | "url" | "image" }
  | { key: string; label: string; kind: "textarea" | "rich_text" }
  | { key: string; label: string; kind: "list"; itemLabel?: string };

export type SectionRegistryEntry = {
  type: SectionType;
  label: string;
  description: string;
  fields: SectionFieldDef[];
  defaultContent: Record<string, unknown>;
  defaultSettings?: Record<string, unknown>;
};

const list = (items: string[] = [""]) =>
  items.map((text, i) => ({
    id: `item-${i}`,
    text,
    visible: true,
    sortOrder: i,
  }));

export const SECTION_REGISTRY: Record<SectionType, SectionRegistryEntry> = {
  hero: {
    type: "hero",
    label: "Hero",
    description: "Full-width hero with headline, body, and buttons",
    fields: [
      { key: "eyebrow", label: "Eyebrow", kind: "text" },
      { key: "headline", label: "Headline", kind: "text" },
      { key: "body", label: "Body", kind: "textarea" },
      { key: "imageUrl", label: "Background image URL", kind: "image" },
      { key: "imageAlt", label: "Image alt text", kind: "text" },
      { key: "primaryCtaLabel", label: "Primary button label", kind: "text" },
      { key: "primaryCtaUrl", label: "Primary button URL", kind: "url" },
      { key: "secondaryCtaLabel", label: "Secondary button label", kind: "text" },
      { key: "secondaryCtaUrl", label: "Secondary button URL", kind: "url" },
      { key: "tertiaryCtaLabel", label: "Third button label", kind: "text" },
      { key: "tertiaryCtaUrl", label: "Third button URL", kind: "url" },
    ],
    defaultContent: {
      eyebrow: "",
      headline: "",
      body: "",
      imageUrl: "",
      imageAlt: "",
      primaryCtaLabel: "",
      primaryCtaUrl: "/partner",
      secondaryCtaLabel: "",
      secondaryCtaUrl: "/give",
      tertiaryCtaLabel: "",
      tertiaryCtaUrl: "/mission",
    },
  },
  text_section: {
    type: "text_section",
    label: "Text section",
    description: "Heading, intro, body, optional bullets and buttons",
    fields: [
      { key: "eyebrow", label: "Eyebrow", kind: "text" },
      { key: "headline", label: "Headline", kind: "text" },
      { key: "subheadline", label: "Subheadline", kind: "text" },
      { key: "body", label: "Body", kind: "textarea" },
      { key: "bullets", label: "Bullet lines", kind: "list", itemLabel: "Bullet" },
      { key: "primaryCtaLabel", label: "Primary button label", kind: "text" },
      { key: "primaryCtaUrl", label: "Primary button URL", kind: "url" },
      { key: "secondaryCtaLabel", label: "Secondary button label", kind: "text" },
      { key: "secondaryCtaUrl", label: "Secondary button URL", kind: "url" },
    ],
    defaultContent: {
      eyebrow: "",
      headline: "",
      subheadline: "",
      body: "",
      bullets: list(),
      primaryCtaLabel: "",
      primaryCtaUrl: "",
      secondaryCtaLabel: "",
      secondaryCtaUrl: "",
    },
  },
  image_text_split: {
    type: "image_text_split",
    label: "Image + text split",
    description: "Two-column section with image and copy",
    fields: [
      { key: "headline", label: "Title", kind: "text" },
      { key: "body", label: "Body", kind: "textarea" },
      { key: "ctaLabel", label: "Link label", kind: "text" },
      { key: "ctaUrl", label: "Link URL", kind: "url" },
      { key: "imageUrl", label: "Image URL", kind: "image" },
      { key: "imageAlt", label: "Image alt", kind: "text" },
    ],
    defaultContent: {
      headline: "",
      body: "",
      ctaLabel: "",
      ctaUrl: "",
      imageUrl: "",
      imageAlt: "",
    },
    defaultSettings: { imagePosition: "right", variant: "default" },
  },
  card_grid: {
    type: "card_grid",
    label: "Card grid",
    description: "Grid of cards with title and body",
    fields: [
      { key: "headline", label: "Section heading", kind: "text" },
      { key: "intro", label: "Intro", kind: "textarea" },
      { key: "cards", label: "Cards", kind: "list", itemLabel: "Card title" },
      { key: "primaryCtaLabel", label: "Footer button label", kind: "text" },
      { key: "primaryCtaUrl", label: "Footer button URL", kind: "url" },
    ],
    defaultContent: {
      headline: "",
      intro: "",
      cards: list(),
      primaryCtaLabel: "",
      primaryCtaUrl: "",
    },
    defaultSettings: { columns: 2 },
  },
  quote: {
    type: "quote",
    label: "Quote",
    description: "Pull quote block",
    fields: [
      { key: "quote", label: "Quote", kind: "textarea" },
      { key: "attribution", label: "Attribution", kind: "text" },
    ],
    defaultContent: { quote: "", attribution: "" },
  },
  cta: {
    type: "cta",
    label: "Call to action",
    description: "Centered CTA with buttons",
    fields: [
      { key: "headline", label: "Headline", kind: "text" },
      { key: "body", label: "Body", kind: "textarea" },
      { key: "primaryCtaLabel", label: "Primary button", kind: "text" },
      { key: "primaryCtaUrl", label: "Primary URL", kind: "url" },
      { key: "secondaryCtaLabel", label: "Secondary button", kind: "text" },
      { key: "secondaryCtaUrl", label: "Secondary URL", kind: "url" },
    ],
    defaultContent: {
      headline: "",
      body: "",
      primaryCtaLabel: "",
      primaryCtaUrl: "",
      secondaryCtaLabel: "",
      secondaryCtaUrl: "",
    },
  },
  stats: {
    type: "stats",
    label: "Stats",
    description: "Statistic highlights",
    fields: [{ key: "items", label: "Stats", kind: "list", itemLabel: "Stat label" }],
    defaultContent: {
      items: list(["", ""]),
    },
  },
  timeline: {
    type: "timeline",
    label: "Timeline",
    description: "Milestone timeline",
    fields: [
      { key: "headline", label: "Headline", kind: "text" },
      { key: "intro", label: "Intro", kind: "textarea" },
      { key: "items", label: "Milestones", kind: "list", itemLabel: "Title" },
    ],
    defaultContent: { headline: "", intro: "", items: list() },
  },
  newsletter_signup: {
    type: "newsletter_signup",
    label: "Newsletter signup",
    description: "Newsletter placeholder",
    fields: [
      { key: "headline", label: "Headline", kind: "text" },
      { key: "body", label: "Body", kind: "textarea" },
    ],
    defaultContent: { headline: "", body: "" },
  },
  featured_posts: {
    type: "featured_posts",
    label: "Featured posts",
    description: "Blog empty state / topics",
    fields: [
      { key: "headline", label: "Headline", kind: "text" },
      { key: "body", label: "Body", kind: "textarea" },
      { key: "topics", label: "Topics", kind: "list", itemLabel: "Topic" },
    ],
    defaultContent: { headline: "", body: "", topics: list() },
  },
};

export function registryFor(type: SectionType): SectionRegistryEntry {
  return SECTION_REGISTRY[type];
}
