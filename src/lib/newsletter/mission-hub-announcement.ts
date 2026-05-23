import type { Prisma } from "@prisma/client";
import { COMMUNITY_POST_AUTHOR_NAME } from "@/lib/community/post-constants";
import type {
  CommunityPostFeedItemBase,
  NewsletterAnnouncementFeedLink,
} from "@/lib/community/types";
import { prisma } from "@/lib/db";
import { formatMissionHubNotificationDeliveryLines } from "@/lib/mission-hub/notification-delivery-message";
import type { NewsletterRecord } from "./types";

export const NEWSLETTER_SOURCE_KIND = "newsletter" as const;

/** General feed teaser when a newsletter is published. */
export const MINISTRY_UPDATES_SPACE_SLUG = "ministry-updates";

/** Dedicated newsletter archive / issue announcements. */
export const NEWSLETTER_SPACE_SLUG = "newsletters";

/** @deprecated Use {@link MINISTRY_UPDATES_SPACE_SLUG}. */
export const NEWSLETTER_ANNOUNCEMENT_SPACE_SLUG = MINISTRY_UPDATES_SPACE_SLUG;

const FALLBACK_ANNOUNCEMENT_SPACE_SLUG = "start-here";

export type NewsletterTargetSpaceType = "ministry_updates" | "newsletter";

export type NewsletterAnnouncementMetadata = {
  kind: "newsletter_announcement";
  newsletterId: string;
  originatingNewsletterId: string;
  newsletterSlug: string;
  newsletterPath: string;
  issueDate: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  targetSpaceType: NewsletterTargetSpaceType;
};

export type UpsertMissionHubAnnouncementResult = {
  postId: string;
  spaceSlug: string;
  spaceId: string;
  created: boolean;
  newsletterPath: string;
  targetSpaceType: NewsletterTargetSpaceType;
};

export type MissionHubNewsletterAnnouncementsResult = {
  ministryUpdates: UpsertMissionHubAnnouncementResult;
  newsletterSpace: UpsertMissionHubAnnouncementResult | null;
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
  targetSpaceType: NewsletterTargetSpaceType,
): NewsletterAnnouncementMetadata {
  return {
    kind: "newsletter_announcement",
    newsletterId: newsletter.id,
    originatingNewsletterId: newsletter.id,
    newsletterSlug: newsletter.slug,
    newsletterPath: newsletterPublicPath(newsletter.slug),
    issueDate: newsletter.issueDate,
    ctaLabel: newsletter.ctaLabel.trim() || null,
    ctaUrl: newsletter.ctaUrl.trim() || null,
    targetSpaceType,
  };
}

/** Teaser for Mission Hub — full content stays on /newsletters/[slug]. */
export function buildNewsletterAnnouncementBody(
  newsletter: NewsletterRecord,
  targetSpaceType: NewsletterTargetSpaceType = "ministry_updates",
): string {
  const path = newsletterPublicPath(newsletter.slug);
  const issueLabel = formatNewsletterIssueDateLabel(newsletter.issueDate);
  const lines: string[] = [];

  if (issueLabel) {
    lines.push(
      targetSpaceType === "newsletter"
        ? `New issue · ${issueLabel}`
        : `Issue date: ${issueLabel}`,
    );
  }

  if (targetSpaceType === "newsletter" && newsletter.title.trim()) {
    lines.push(newsletter.title.trim());
  }

  if (newsletter.subtitle.trim()) {
    lines.push(newsletter.subtitle.trim());
  }

  const preview =
    newsletter.excerpt.trim() ||
    (targetSpaceType === "newsletter"
      ? "The latest newsletter is ready to read."
      : "A new newsletter is available for Mission Hub members and partners.");
  lines.push(preview);
  lines.push("");
  lines.push(`Read full newsletter → ${path}`);

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

async function resolvePublishedSpaceBySlug(
  slug: string,
): Promise<{ id: string; slug: string } | null> {
  return prisma.communitySpaceRecord.findFirst({
    where: { slug, status: "published" },
    select: { id: true, slug: true },
  });
}

async function resolveMinistryUpdatesSpaceId(): Promise<{ id: string; slug: string } | null> {
  for (const slug of [MINISTRY_UPDATES_SPACE_SLUG, FALLBACK_ANNOUNCEMENT_SPACE_SLUG]) {
    const space = await resolvePublishedSpaceBySlug(slug);
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

async function findExistingNewsletterAnnouncement(
  newsletterId: string,
  spaceId: string,
): Promise<{ id: string } | null> {
  return prisma.communityPostRecord.findFirst({
    where: {
      sourceKind: NEWSLETTER_SOURCE_KIND,
      sourceId: newsletterId,
      spaceId,
    },
    select: { id: true },
  });
}

async function upsertAnnouncementInSpace(
  newsletter: NewsletterRecord,
  space: { id: string; slug: string },
  targetSpaceType: NewsletterTargetSpaceType,
  publisherUserId: string | null,
): Promise<UpsertMissionHubAnnouncementResult> {
  const announcementMeta = buildNewsletterAnnouncementMetadata(newsletter, targetSpaceType);
  const metadata = announcementMeta as unknown as Prisma.InputJsonValue;
  const data = {
    spaceId: space.id,
    authorUserId: publisherUserId,
    title: newsletter.title.trim(),
    body: buildNewsletterAnnouncementBody(newsletter, targetSpaceType),
    excerpt: newsletter.excerpt.trim() || newsletter.subtitle.trim() || null,
    postType: "newsletter",
    status: "published",
    coverImageUrl: newsletter.featuredImageUrl,
    sourceKind: NEWSLETTER_SOURCE_KIND,
    sourceId: newsletter.id,
    metadata,
    publishedAt: publishedAtFromNewsletter(newsletter),
  };

  const existing = await findExistingNewsletterAnnouncement(newsletter.id, space.id);

  if (existing) {
    const row = await prisma.communityPostRecord.update({
      where: { id: existing.id },
      data,
      select: { id: true },
    });
    return {
      postId: row.id,
      spaceSlug: space.slug,
      spaceId: space.id,
      created: false,
      newsletterPath: announcementMeta.newsletterPath,
      targetSpaceType,
    };
  }

  const row = await prisma.communityPostRecord.create({
    data,
    select: { id: true },
  });

  return {
    postId: row.id,
    spaceSlug: space.slug,
    spaceId: space.id,
    created: true,
    newsletterPath: announcementMeta.newsletterPath,
    targetSpaceType,
  };
}

/**
 * Create or refresh Mission Hub feed announcements for a published newsletter
 * in Ministry Updates and the dedicated Newsletter space.
 */
export async function upsertMissionHubNewsletterAnnouncements(
  newsletter: NewsletterRecord,
  publisherUserId: string | null,
): Promise<MissionHubNewsletterAnnouncementsResult> {
  const ministrySpace = await resolveMinistryUpdatesSpaceId();
  if (!ministrySpace) {
    throw new Error(
      "No published Mission Hub space found for newsletter announcements (ministry-updates or start-here).",
    );
  }

  const ministryUpdates = await upsertAnnouncementInSpace(
    newsletter,
    ministrySpace,
    "ministry_updates",
    publisherUserId,
  );

  let newsletterSpace: UpsertMissionHubAnnouncementResult | null = null;
  const dedicatedSpace = await resolvePublishedSpaceBySlug(NEWSLETTER_SPACE_SLUG);
  if (dedicatedSpace) {
    newsletterSpace = await upsertAnnouncementInSpace(
      newsletter,
      dedicatedSpace,
      "newsletter",
      publisherUserId,
    );
  } else {
    console.warn(
      "[newsletter] Newsletter space not found; Ministry Updates announcement only",
      {
        newsletterId: newsletter.id,
        expectedSlug: NEWSLETTER_SPACE_SLUG,
      },
    );
  }

  return { ministryUpdates, newsletterSpace };
}

/** @deprecated Prefer {@link upsertMissionHubNewsletterAnnouncements}. */
export async function upsertMissionHubNewsletterAnnouncement(
  newsletter: NewsletterRecord,
  publisherUserId: string | null,
): Promise<UpsertMissionHubAnnouncementResult> {
  const { ministryUpdates } = await upsertMissionHubNewsletterAnnouncements(
    newsletter,
    publisherUserId,
  );
  return ministryUpdates;
}

/** Hide Mission Hub announcements when newsletter is no longer published. */
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

function announcementStatusLine(
  label: string,
  result: UpsertMissionHubAnnouncementResult,
): string {
  return result.created
    ? `${label} post created in /community/${result.spaceSlug}.`
    : `${label} post updated in /community/${result.spaceSlug} (no duplicate).`;
}

export function formatNewsletterPublishSuccessMessage(input: {
  newsletterSlug: string;
  hub: {
    ministryUpdates: UpsertMissionHubAnnouncementResult;
    newsletterSpace: UpsertMissionHubAnnouncementResult | null;
    inAppNotificationsSent: number;
    inAppNotificationsUpdated: number;
    emailNotificationsSent: number;
    emailNotificationsDeduped?: number;
    emailNotificationsFailed?: number;
    emailEnabled: boolean;
    emailDisabledReason?: string | null;
    emailRecipientsPrepared: number;
    skippedMutedOrDisabled: number;
  };
}): string {
  const lines = [
    "Newsletter published.",
    `Public page: ${newsletterPublicPath(input.newsletterSlug)}`,
    announcementStatusLine("Ministry Updates", input.hub.ministryUpdates),
  ];

  if (input.hub.newsletterSpace) {
    lines.push(announcementStatusLine("Newsletter space", input.hub.newsletterSpace));
  } else {
    lines.push(
      `Newsletter space: skipped (no published "${NEWSLETTER_SPACE_SLUG}" space found).`,
    );
  }

  lines.push(
    ...formatMissionHubNotificationDeliveryLines({
      inAppNotificationsSent: input.hub.inAppNotificationsSent,
      inAppNotificationsUpdated: input.hub.inAppNotificationsUpdated,
      emailNotificationsSent: input.hub.emailNotificationsSent,
      emailNotificationsDeduped: input.hub.emailNotificationsDeduped ?? 0,
      emailNotificationsFailed: input.hub.emailNotificationsFailed ?? 0,
      emailEnabled: input.hub.emailEnabled,
      emailDisabledReason: input.hub.emailDisabledReason ?? null,
      emailRecipientsPrepared: input.hub.emailRecipientsPrepared,
    }),
  );

  if (input.hub.skippedMutedOrDisabled > 0) {
    lines.push(`Skipped (muted or disabled): ${input.hub.skippedMutedOrDisabled}`);
  }

  return lines.join("\n");
}

export const NEWSLETTER_ANNOUNCEMENT_AUTHOR_NAME = COMMUNITY_POST_AUTHOR_NAME;
