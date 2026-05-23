export type BlogPostStatus = "DRAFT" | "PUBLISHED";

export type BlogPostRecord = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  featuredImageUrl: string | null;
  featuredImageAlt: string;
  status: BlogPostStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BlogPostInput = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  featuredImageUrl: string | null;
  featuredImageAlt: string;
  status: BlogPostStatus;
  publishedAt: string | null;
};
