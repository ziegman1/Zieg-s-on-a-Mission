import {
  buildWeeklyMissionHubDigest,
  resolveDigestDateRange,
  type DigestCommentInput,
  type DigestPostInput,
  type DigestWindowInput,
  type WeeklyMissionHubDigest,
} from "@/lib/mission-hub/weekly-digest-core";
import { prisma } from "@/lib/db";

const postAuthorSelect = {
  id: true,
  name: true,
  image: true,
  role: true,
  communityMember: {
    select: {
      firstName: true,
      lastName: true,
      displayName: true,
      profileImageUrl: true,
    },
  },
} as const;

/** Load digest content from the database. Does not send email. */
export async function generateWeeklyMissionHubDigest(
  window: DigestWindowInput = {},
): Promise<WeeklyMissionHubDigest> {
  const { start, end } = resolveDigestDateRange(window);

  const [newsletterRows, postRows, commentRows, reactionCount] = await Promise.all([
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
        body: true,
        excerpt: true,
        postType: true,
        sourceKind: true,
        publishedAt: true,
        createdAt: true,
        space: {
          select: { title: true, slug: true, spaceType: true, settings: true },
        },
        authorUser: { select: postAuthorSelect },
      },
    }),
    prisma.communityPostCommentRecord.findMany({
      where: {
        status: "published",
        createdAt: { gte: start, lte: end },
        post: { status: "published", space: { status: "published" } },
      },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        body: true,
        displayName: true,
        createdAt: true,
        member: {
          select: { firstName: true, lastName: true, displayName: true },
        },
        post: {
          select: {
            id: true,
            title: true,
            space: { select: { title: true, slug: true } },
          },
        },
      },
    }),
    prisma.communityPostReactionRecord.count({
      where: { createdAt: { gte: start, lte: end } },
    }),
  ]);

  return buildWeeklyMissionHubDigest({
    dateRange: { start: start.toISOString(), end: end.toISOString() },
    posts: postRows as DigestPostInput[],
    newsletters: newsletterRows.map((n) => ({
      id: n.id,
      title: n.title,
      subtitle: n.subtitle,
      excerpt: n.excerpt,
      slug: n.slug,
      issueDate: n.issueDate,
      publishedAt: n.publishedAt!,
    })),
    comments: commentRows as DigestCommentInput[],
    reactionCount,
    digestEmailRecipientsPrepared: 0,
  });
}
