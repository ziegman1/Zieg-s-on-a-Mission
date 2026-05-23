import type { NewsletterBlocks } from "./blocks/types";
import type { CtaAlign } from "./align";

export type NewsletterStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type NewsletterRecord = {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  issueDate: string | null;
  headerImageUrl: string | null;
  useDefaultBrandedHeader: boolean;
  featuredImageUrl: string | null;
  excerpt: string;
  body: string;
  bodyBlocks: NewsletterBlocks;
  ctaLabel: string;
  ctaUrl: string;
  ctaAlign: CtaAlign;
  footerImageUrl: string | null;
  footerAltText: string;
  useDefaultFooterImage: boolean;
  seoTitle: string;
  seoDescription: string;
  status: NewsletterStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NewsletterInput = {
  id?: string;
  title: string;
  subtitle: string;
  slug: string;
  issueDate: string | null;
  headerImageUrl: string | null;
  useDefaultBrandedHeader: boolean;
  featuredImageUrl: string | null;
  excerpt: string;
  body: string;
  bodyBlocks: NewsletterBlocks;
  ctaLabel: string;
  ctaUrl: string;
  ctaAlign: CtaAlign;
  footerImageUrl: string | null;
  footerAltText: string;
  useDefaultFooterImage: boolean;
  seoTitle: string;
  seoDescription: string;
  status: NewsletterStatus;
  publishedAt: string | null;
};
