import { unstable_noStore as noStore } from "next/cache";
import type { Prisma, NewsletterStatus as PrismaNewsletterStatus } from "@prisma/client";
import { blocksToPlainBody } from "./blocks/plain-text";
import { parseNewsletterBlocks } from "./blocks/parse";
import { assertNewsletterContent } from "./blocks/validate";
import { parseCtaAlign } from "./align";
import { slugifyTitle, ensureUniqueNewsletterSlug } from "./slug";
import { getNewsletterDelegate, runNewsletterQuery, withNewsletterDelegate } from "./prisma-newsletter";
import type { NewsletterInput, NewsletterRecord, NewsletterStatus } from "./types";

function requireDatabaseUrl(): void {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      "DATABASE_URL is not configured. Newsletters cannot be saved without a database connection.",
    );
  }
}

export function isNewsletterPubliclyVisible(status: NewsletterStatus): boolean {
  return status === "PUBLISHED";
}

function toRecord(row: {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  issueDate: Date | null;
  headerImageUrl: string | null;
  useDefaultBrandedHeader: boolean;
  featuredImageUrl: string | null;
  excerpt: string;
  body: string;
  bodyBlocks: unknown;
  ctaLabel: string;
  ctaUrl: string;
  ctaAlign: string;
  footerImageUrl: string | null;
  footerAltText: string;
  useDefaultFooterImage: boolean;
  seoTitle: string;
  seoDescription: string;
  status: PrismaNewsletterStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): NewsletterRecord {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    slug: row.slug,
    issueDate: row.issueDate?.toISOString() ?? null,
    headerImageUrl: row.headerImageUrl,
    useDefaultBrandedHeader: row.useDefaultBrandedHeader,
    featuredImageUrl: row.featuredImageUrl,
    excerpt: row.excerpt,
    body: row.body,
    bodyBlocks: parseNewsletterBlocks(row.bodyBlocks),
    ctaLabel: row.ctaLabel,
    ctaUrl: row.ctaUrl,
    ctaAlign: parseCtaAlign(row.ctaAlign),
    footerImageUrl: row.footerImageUrl,
    footerAltText: row.footerAltText,
    useDefaultFooterImage: row.useDefaultFooterImage,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    status: row.status,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  return runNewsletterQuery(async (newsletter) => {
    const row = await newsletter.findUnique({ where: { slug }, select: { id: true } });
    if (!row) return false;
    if (excludeId && row.id === excludeId) return false;
    return true;
  });
}

function parseIssueDate(iso: string | null): Date | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function resolvePublishedAt(
  status: NewsletterStatus,
  publishedAtIso: string | null,
): Date | null {
  if (status === "ARCHIVED") {
    if (publishedAtIso?.trim()) {
      const d = new Date(publishedAtIso);
      if (!Number.isNaN(d.getTime())) return d;
    }
    return null;
  }
  if (!isNewsletterPubliclyVisible(status)) return null;
  if (publishedAtIso?.trim()) {
    const d = new Date(publishedAtIso);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

export function validateNewsletterInput(
  input: NewsletterInput,
  intent: "draft" | "publish",
): void {
  if (!input.title.trim()) {
    throw new Error("Title is required.");
  }
  const validationIntent = intent === "publish" ? "publish" : "draft";
  assertNewsletterContent(input.body, input.bodyBlocks, validationIntent);
}

export async function listNewslettersForAdmin(): Promise<NewsletterRecord[]> {
  noStore();
  requireDatabaseUrl();
  const rows = await runNewsletterQuery((newsletter) =>
    newsletter.findMany({
      orderBy: [{ updatedAt: "desc" }],
    }),
  );
  return rows.map(toRecord);
}

export async function listPublishedNewsletters(): Promise<NewsletterRecord[]> {
  noStore();
  if (!process.env.DATABASE_URL?.trim()) return [];
  return withNewsletterDelegate([], async (newsletter) => {
    const rows = await newsletter.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ publishedAt: "desc" }, { issueDate: "desc" }, { createdAt: "desc" }],
    });
    return rows.map(toRecord);
  });
}

export async function getNewsletterBySlug(slug: string): Promise<NewsletterRecord | null> {
  noStore();
  if (!process.env.DATABASE_URL?.trim()) return null;
  return withNewsletterDelegate(null, async (newsletter) => {
    const row = await newsletter.findFirst({
      where: { slug, status: "PUBLISHED" },
    });
    return row ? toRecord(row) : null;
  });
}

export async function getNewsletterBySlugAnyStatus(slug: string): Promise<NewsletterRecord | null> {
  noStore();
  requireDatabaseUrl();
  return runNewsletterQuery(async (newsletter) => {
    const row = await newsletter.findUnique({ where: { slug } });
    return row ? toRecord(row) : null;
  });
}

export async function getNewsletterById(id: string): Promise<NewsletterRecord | null> {
  noStore();
  requireDatabaseUrl();
  return runNewsletterQuery(async (newsletter) => {
    const row = await newsletter.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  });
}

export async function saveNewsletter(
  input: NewsletterInput,
  intent: "draft" | "publish" | "archive" = input.status === "PUBLISHED"
    ? "publish"
    : input.status === "ARCHIVED"
      ? "archive"
      : "draft",
): Promise<NewsletterRecord> {
  requireDatabaseUrl();
  const validationIntent = intent === "publish" ? "publish" : "draft";
  validateNewsletterInput(input, validationIntent);

  const title = input.title.trim();
  const slugBase = slugifyTitle(input.slug.trim() || title);
  const slug = await ensureUniqueNewsletterSlug(slugBase, slugExists, input.id);

  let status: NewsletterStatus = input.status;
  if (intent === "publish") status = "PUBLISHED";
  else if (intent === "archive") status = "ARCHIVED";
  else if (intent === "draft") status = "DRAFT";

  const publishedAt = resolvePublishedAt(status, input.publishedAt);

  const bodyBlocks = parseNewsletterBlocks(input.bodyBlocks);
  const body = blocksToPlainBody(bodyBlocks) || input.body;

  const data = {
    title,
    subtitle: input.subtitle.trim(),
    slug,
    issueDate: parseIssueDate(input.issueDate),
    headerImageUrl: input.headerImageUrl?.trim() || null,
    useDefaultBrandedHeader: input.useDefaultBrandedHeader,
    featuredImageUrl: input.featuredImageUrl?.trim() || null,
    excerpt: input.excerpt.trim(),
    body,
    bodyBlocks: bodyBlocks as unknown as Prisma.InputJsonValue,
    ctaLabel: input.ctaLabel.trim(),
    ctaUrl: input.ctaUrl.trim(),
    ctaAlign: parseCtaAlign(input.ctaAlign),
    footerImageUrl: input.footerImageUrl?.trim() || null,
    footerAltText: input.footerAltText.trim(),
    useDefaultFooterImage: input.useDefaultFooterImage,
    seoTitle: input.seoTitle.trim(),
    seoDescription: input.seoDescription.trim(),
    status,
    publishedAt,
  };

  let row;
  if (input.id) {
    row = await runNewsletterQuery((newsletter) =>
      newsletter.update({
        where: { id: input.id },
        data,
      }),
    );
  } else {
    row = await runNewsletterQuery((newsletter) => newsletter.create({ data }));
  }

  const record = toRecord(row);

  const verify = await getNewsletterById(record.id);
  if (!verify) {
    throw new Error(
      `Newsletter write did not persist (id ${record.id}). Check database connection and migrations.`,
    );
  }

  return record;
}

export async function getPublishedNewsletterSlugs(): Promise<string[]> {
  noStore();
  if (!process.env.DATABASE_URL?.trim()) return [];
  return withNewsletterDelegate([], async (newsletter) => {
    const rows = await newsletter.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true },
    });
    return rows.map((r) => r.slug);
  });
}

export function assertNewsletterReady(): void {
  requireDatabaseUrl();
  if (!getNewsletterDelegate()) {
    throw new Error(
      "Newsletter Prisma client is not ready. Run npx prisma generate and restart the dev server.",
    );
  }
}
