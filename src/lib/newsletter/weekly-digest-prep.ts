import { unstable_noStore as noStore } from "next/cache";
import { memberWantsWeeklyDigest } from "@/lib/community/notification-preferences";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  mergeNotificationPreferences,
} from "@/lib/community/settings-types";
import { getUserNotificationPreferences } from "@/lib/community/user-notification-prefs";
import {
  NEWSLETTER_ANNOUNCEMENT_SPACE_SLUG,
  NEWSLETTER_SOURCE_KIND,
  newsletterPublicPath,
} from "@/lib/newsletter/mission-hub-announcement";
import { prisma } from "@/lib/db";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type DigestNewsletterItem = {
  id: string;
  title: string;
  subtitle: string;
  excerpt: string;
  slug: string;
  path: string;
  issueDate: string | null;
  publishedAt: string;
};

export type DigestPostItem = {
  id: string;
  title: string | null;
  excerpt: string | null;
  spaceTitle: string;
  spaceSlug: string;
  postType: string;
  path: string;
  publishedAt: string;
  isNewsletterAnnouncement: boolean;
};

export type WeeklyDigestPrep = {
  prepared: true;
  deliveryEnabled: false;
  periodStart: string;
  periodEnd: string;
  newsletters: DigestNewsletterItem[];
  ministryUpdates: DigestPostItem[];
  hubPosts: DigestPostItem[];
  digestEmailRecipientsPrepared: number;
};

export function digestWindow(referenceDate: Date = new Date()): { start: Date; end: Date } {
  const end = referenceDate;
  const start = new Date(end.getTime() - 7 * MS_PER_DAY);
  return { start, end };
}

function postPath(spaceSlug: string, postId: string): string {
  return `/community/${spaceSlug}#post-${postId}`;
}

function rowToDigestPost(
  row: {
    id: string;
    title: string | null;
    excerpt: string | null;
    postType: string;
    sourceKind: string | null;
    publishedAt: Date | null;
    createdAt: Date;
    space: { title: string; slug: string };
  },
): DigestPostItem {
  const publishedAt = (row.publishedAt ?? row.createdAt).toISOString();
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    spaceTitle: row.space.title,
    spaceSlug: row.space.slug,
    postType: row.postType,
    path: postPath(row.space.slug, row.id),
    publishedAt,
    isNewsletterAnnouncement: row.sourceKind === NEWSLETTER_SOURCE_KIND,
  };
}

/**
 * Collects digest content for the past 7 days. Does not send email.
 */
export async function prepareWeeklyMissionHubDigest(
  referenceDate: Date = new Date(),
): Promise<WeeklyDigestPrep> {
  noStore();
  const { start, end } = digestWindow(referenceDate);

  const [newsletterRows, postRows, members] = await Promise.all([
    prisma.newsletter.findMany({
      where: {
        status: "PUBLISHED",
        publishedAt: { gte: start, lte: end },
      },
      orderBy: [{ publishedAt: "desc" }],
      select: {
        id: true,
        title: true,
        subtitle: true,
        excerpt: true,
        slug: true,
        issueDate: true,
        publishedAt: true,
      },
    }),
    prisma.communityPostRecord.findMany({
      where: {
        status: "published",
        publishedAt: { gte: start, lte: end },
        space: { status: "published" },
      },
      orderBy: [{ publishedAt: "desc" }],
      select: {
        id: true,
        title: true,
        excerpt: true,
        postType: true,
        sourceKind: true,
        publishedAt: true,
        createdAt: true,
        space: { select: { title: true, slug: true } },
      },
    }),
    prisma.communityMemberRecord.findMany({
      where: { status: "active", userId: { not: null } },
      select: { userId: true },
    }),
  ]);

  const newsletters: DigestNewsletterItem[] = newsletterRows.map((n) => ({
    id: n.id,
    title: n.title,
    subtitle: n.subtitle,
    excerpt: n.excerpt,
    slug: n.slug,
    path: newsletterPublicPath(n.slug),
    issueDate: n.issueDate?.toISOString() ?? null,
    publishedAt: n.publishedAt!.toISOString(),
  }));

  const ministryUpdates: DigestPostItem[] = [];
  const hubPosts: DigestPostItem[] = [];

  for (const row of postRows) {
    const item = rowToDigestPost(row);
    if (row.space.slug === NEWSLETTER_ANNOUNCEMENT_SPACE_SLUG) {
      ministryUpdates.push(item);
    } else {
      hubPosts.push(item);
    }
  }

  const userIds = [
    ...new Set(members.map((m) => m.userId).filter((id): id is string => Boolean(id))),
  ];

  let digestEmailRecipientsPrepared = 0;
  for (const userId of userIds) {
    let prefs = DEFAULT_NOTIFICATION_PREFERENCES;
    try {
      prefs = await getUserNotificationPreferences(userId);
    } catch {
      prefs = mergeNotificationPreferences(null);
    }
    if (memberWantsWeeklyDigest(prefs)) digestEmailRecipientsPrepared += 1;
  }

  return {
    prepared: true,
    deliveryEnabled: false,
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    newsletters,
    ministryUpdates,
    hubPosts,
    digestEmailRecipientsPrepared,
  };
}

/** True when publishedAt falls inside the digest window (exclusive of older items). */
export function isWithinDigestWindow(
  publishedAtIso: string,
  referenceDate: Date = new Date(),
): boolean {
  const { start, end } = digestWindow(referenceDate);
  const t = new Date(publishedAtIso).getTime();
  return t >= start.getTime() && t <= end.getTime();
}
