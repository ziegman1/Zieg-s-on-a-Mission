import type { Prisma } from "@prisma/client";
import { COMMUNITY_POST_AUTHOR_NAME } from "@/lib/community/post-constants";
import type {
  CommunityPostFeedItemBase,
  NewsletterAnnouncementFeedLink,
} from "@/lib/community/types";
import { prisma } from "@/lib/db";
import type { NewsletterRecord } from "./types";

export const NEWSLETTER_SOURCE_KIND = "newsletter" as const;

/** Published newsletter announcements appear in this Mission Hub space. */
export const NEWSLETTER_ANNOUNCEMENT_SPACE_SLUG = "ministry-updates";

const FALLBACK_ANNOUNCEMENT_SPACE_SLUG = "start-here";

export type NewsletterAnnouncementMetadata = {
  kind: "newsletter_announcement";
  newsletterId: string;
  newsletterSlug: string;
  newsletterPath: string;
  issueDate: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
};

export type UpsertMissionHubAnnouncementResult = {
  postId: string;
  spaceSlug: string;
  created: boolean;
  newsletterPath: string;
};

export function newsletterPublicPath(slug: string): string {
  return `/newsletters/${slug.trim()}`;
}

export function formatNewsletterIssueDateLabel(issueDate: string | null): string | null {
  if (!issueDate?.trim()) return null;
  try {
    return new Date(issueDate).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

export function buildNewsletterAnnouncementMetadata(
  newsletter: NewsletterRecord,
): NewsletterAnnouncementMetadata {
  return {
    kind: "newsletter_announcement",
    newsletterId: newsletter.id,
    newsletterSlug: newsletter.slug,
    newsletterPath: newsletterPublicPath(newsletter.slug),
    issueDate: newsletter.issueDate,
    ctaLabel: newsletter.ctaLabel.trim() || null,
    ctaUrl: newsletter.ctaUrl.trim() || null,
  };
}

/** Teaser for Mission Hub — full content stays on /newsletters/[slug]. */
export function buildNewsletterAnnouncementBody(newsletter: NewsletterRecord): string {
  const path = newsletterPublicPath(newsletter.slug);
  const issueLabel = formatNewsletterIssueDateLabel(newsletter.issueDate);
  const lines: string[] = [];

  if (issueLabel) {
    lines.push(`Issue date: ${issueLabel}`);
  }
  if (newsletter.subtitle.trim()) {
    lines.push(newsletter.subtitle.trim());
  }
  const preview =
    newsletter.excerpt.trim() ||
    "A new newsletter is available for Mission Hub members and partners.";
  lines.push(preview);
  lines.push("");
  lines.push(`Read the full newsletter: ${path}`);

  const ctaLabel = newsletter.ctaLabel.trim();
  const ctaUrl = newsletter.ctaUrl.trim();
  if (ctaLabel && ctaUrl) {
    lines.push(`${ctaLabel}: ${ctaUrl}`);
  }

  return lines.join("\n");
}

export function parseNewsletterAnnouncementMetadata(
  metadata: unknown,
  sourceKind: string | null,
): NewsletterAnnouncementFeedLink | null {
  if (sourceKind !== NEWSLETTER_SOURCE_KIND) return null;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const m = metadata as Record<string, unknown>;
  if (m.kind !== "newsletter_announcement") return null;
  const slug = typeof m.newsletterSlug === "string" ? m.newsletterSlug : "";
  const path =
    typeof m.newsletterPath === "string" && m.newsletterPath.trim()
      ? m.newsletterPath.trim()
      : slug
        ? newsletterPublicPath(slug)
        : "";
  if (!path) return null;
  return {
    newsletterPath: path,
    newsletterSlug: slug,
    issueDate: typeof m.issueDate === "string" ? m.issueDate : null,
    ctaLabel: typeof m.ctaLabel === "string" ? m.ctaLabel : null,
    ctaUrl: typeof m.ctaUrl === "string" ? m.ctaUrl : null,
  };
}

export function attachNewsletterAnnouncementToFeedItem<
  T extends CommunityPostFeedItemBase,
>(item: T, row: { sourceKind: string | null; metadata: unknown }): T {
  const link = parseNewsletterAnnouncementMetadata(row.metadata, row.sourceKind);
  if (!link) return item;
  return { ...item, newsletterAnnouncement: link };
}

async function resolveAnnouncementSpaceId(): Promise<{ id: string; slug: string } | null> {
  for (const slug of [NEWSLETTER_ANNOUNCEMENT_SPACE_SLUG, FALLBACK_ANNOUNCEMENT_SPACE_SLUG]) {
    const space = await prisma.communitySpaceRecord.findFirst({
      where: { slug, status: "published" },
      select: { id: true, slug: true },
    });
    if (space) return space;
  }
  return null;
}

function publishedAtFromNewsletter(newsletter: NewsletterRecord): Date {
  if (newsletter.publishedAt?.trim()) {
    const d = new Date(newsletter.publishedAt);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

/**
 * Create or refresh a Mission Hub feed announcement for a published newsletter.
 * Newsletter Builder remains source of truth; this is a linked teaser only.
 */
export async function upsertMissionHubNewsletterAnnouncement(
  newsletter: NewsletterRecord,
  publisherUserId: string | null,
): Promise<UpsertMissionHubAnnouncementResult> {
  const space = await resolveAnnouncementSpaceId();
  if (!space) {
    throw new Error(
      "No published Mission Hub space found for newsletter announcements (ministry-updates or start-here).",
    );
  }

  const announcementMeta = buildNewsletterAnnouncementMetadata(newsletter);
  const metadata = announcementMeta as unknown as Prisma.InputJsonValue;
  const data = {
    spaceId: space.id,
    authorUserId: publisherUserId,
    title: newsletter.title.trim(),
    body: buildNewsletterAnnouncementBody(newsletter),
    excerpt: newsletter.excerpt.trim() || newsletter.subtitle.trim() || null,
    postType: "newsletter",
    status: "published",
    coverImageUrl: newsletter.featuredImageUrl,
    sourceKind: NEWSLETTER_SOURCE_KIND,
    sourceId: newsletter.id,
    metadata,
    publishedAt: publishedAtFromNewsletter(newsletter),
  };

  const existing = await prisma.communityPostRecord.findUnique({
    where: {
      sourceKind_sourceId: {
        sourceKind: NEWSLETTER_SOURCE_KIND,
        sourceId: newsletter.id,
      },
    },
    select: { id: true },
  });

  if (existing) {
    const row = await prisma.communityPostRecord.update({
      where: { id: existing.id },
      data,
      select: { id: true },
    });
    return {
      postId: row.id,
      spaceSlug: space.slug,
      created: false,
      newsletterPath: announcementMeta.newsletterPath,
    };
  }

  const row = await prisma.communityPostRecord.create({
    data,
    select: { id: true },
  });

  return {
    postId: row.id,
    spaceSlug: space.slug,
    created: true,
    newsletterPath: announcementMeta.newsletterPath,
  };
}

/** Hide Mission Hub announcement when newsletter is no longer published. */
export async function archiveMissionHubNewsletterAnnouncement(
  newsletterId: string,
): Promise<boolean> {
  const result = await prisma.communityPostRecord.updateMany({
    where: {
      sourceKind: NEWSLETTER_SOURCE_KIND,
      sourceId: newsletterId,
      status: "published",
    },
    data: { status: "archived" },
  });
  return result.count > 0;
}

export function formatNewsletterPublishSuccessMessage(input: {
  newsletterSlug: string;
  hub: {
    announcement: UpsertMissionHubAnnouncementResult;
    announcementCreated: boolean;
    emailRecipientsPrepared: number;
    inAppRecipientsPrepared: number;
    pushRecipientsPrepared: number;
    skippedMutedOrDisabled: number;
    deliveryEnabled: boolean;
  };
}): string {
  const lines = [
    "Newsletter published.",
    `Public page: ${newsletterPublicPath(input.newsletterSlug)}`,
    input.hub.announcementCreated
      ? "Mission Hub announcement created."
      : "Mission Hub announcement updated (no duplicate).",
    `Email recipients prepared: ${input.hub.emailRecipientsPrepared}`,
    `In-app recipients prepared: ${input.hub.inAppRecipientsPrepared}`,
    `Push recipients prepared: ${input.hub.pushRecipientsPrepared}`,
    `Skipped (muted or disabled): ${input.hub.skippedMutedOrDisabled}`,
    input.hub.deliveryEnabled
      ? "Delivery is enabled."
      : "Delivery disabled for now — no emails, in-app, or push sent yet.",
  ];
  return lines.join("\n");
}

export const NEWSLETTER_ANNOUNCEMENT_AUTHOR_NAME = COMMUNITY_POST_AUTHOR_NAME;
