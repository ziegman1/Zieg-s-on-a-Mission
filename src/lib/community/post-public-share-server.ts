import "server-only";

import { postAuthorUserSelect } from "@/lib/community/post-author";
import {
  buildSharePreview,
  evaluatePostShareEligibility,
  parsePublicShareMetadata,
  type PublicSharePreview,
} from "@/lib/community/post-public-share";
import { prisma } from "@/lib/db";

export type PostShareRecord = {
  id: string;
  status: string;
  title: string | null;
  body: string;
  excerpt: string | null;
  postType: string;
  coverImageUrl: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  sourceKind: string | null;
  metadata: unknown;
  authorRole: string | null;
  spaceStatus: string;
  spaceSlug: string;
  spaceTitle: string;
};

const postShareInclude = {
  space: { select: { title: true, slug: true, status: true } },
  authorUser: { select: postAuthorUserSelect },
} as const;

function mapPostShareRecord(
  row: Awaited<
    ReturnType<
      typeof prisma.communityPostRecord.findUnique<{
        where: { id: string };
        include: typeof postShareInclude;
      }>
    >
  >,
): PostShareRecord | null {
  if (!row?.space) return null;
  return {
    id: row.id,
    status: row.status,
    title: row.title,
    body: row.body,
    excerpt: row.excerpt,
    postType: row.postType,
    coverImageUrl: row.coverImageUrl,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    sourceKind: row.sourceKind,
    metadata: row.metadata,
    authorRole: row.authorUser?.role ?? null,
    spaceStatus: row.space.status,
    spaceSlug: row.space.slug,
    spaceTitle: row.space.title,
  };
}

export async function loadPostShareRecord(postId: string): Promise<PostShareRecord | null> {
  const row = await prisma.communityPostRecord.findUnique({
    where: { id: postId },
    include: postShareInclude,
  });
  return mapPostShareRecord(row);
}

export function buildPreviewFromShareRecord(
  record: PostShareRecord,
  shareMeta?: ReturnType<typeof parsePublicShareMetadata>,
): PublicSharePreview {
  return buildSharePreview({
    postId: record.id,
    title: record.title,
    body: record.body,
    excerpt: record.excerpt,
    coverImageUrl: record.coverImageUrl,
    publishedAt: record.publishedAt,
    createdAt: record.createdAt,
    spaceTitle: record.spaceTitle,
    spaceSlug: record.spaceSlug,
    sourceKind: record.sourceKind,
    metadata: record.metadata,
    postType: record.postType,
    shareTitle: shareMeta?.shareTitle,
    shareExcerpt: shareMeta?.shareExcerpt,
  });
}

export function evaluateShareRecordEligibility(record: PostShareRecord) {
  return evaluatePostShareEligibility({
    status: record.status,
    body: record.body,
    postType: record.postType,
    sourceKind: record.sourceKind,
    metadata: record.metadata,
    authorRole: record.authorRole,
    spaceStatus: record.spaceStatus,
    spaceSlug: record.spaceSlug,
  });
}

/** Public share landing page — only when sharing is enabled and still eligible. */
export async function loadPublicSharePagePreview(
  postId: string,
): Promise<PublicSharePreview | null> {
  const record = await loadPostShareRecord(postId);
  if (!record) return null;

  const shareMeta = parsePublicShareMetadata(record.metadata);
  if (!shareMeta?.enabled) return null;

  const eligibility = evaluateShareRecordEligibility(record);
  if (!eligibility.eligible) return null;

  return buildPreviewFromShareRecord(record, shareMeta);
}
