import type { CommunitySpaceRecord } from "@prisma/client";
import { DEFAULT_COMMUNITY_ICON } from "@/lib/community/constants";
import { countPublishedPostsBySpaceIds } from "@/lib/community/posts";
import {
  experienceFromSpaceRecord,
  parseSpaceIcon,
  type CommunitySpaceDetail,
} from "@/lib/community/space-experience";
import type { CommunitySpace, CommunitySpaceIcon } from "@/lib/community/types";
import { interactionFromSpaceRow } from "@/lib/community/space-experience";
import { communitySpaceListOrderBy } from "@/lib/community/space-order";
import { prisma } from "@/lib/db";

const ICON_VALUES = new Set<string>([
  "prayer",
  "praise",
  "updates",
  "behind_scenes",
  "newsletter",
  "blog",
  "resources",
  "events",
]);

function parseIcon(icon: string | null | undefined): CommunitySpaceIcon {
  if (icon && ICON_VALUES.has(icon)) return icon as CommunitySpaceIcon;
  return DEFAULT_COMMUNITY_ICON;
}

export function communityRecordToSpace(row: CommunitySpaceRecord): CommunitySpace {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    icon: parseIcon(row.icon),
    status: row.status as CommunitySpace["status"],
    postCount: 0,
    sortOrder: row.sortOrder,
  };
}

function recordToSpaceDetail(
  row: CommunitySpaceRecord,
  postCount: number,
): CommunitySpaceDetail {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    icon: parseSpaceIcon(row.icon),
    status: row.status,
    postCount,
    sortOrder: row.sortOrder,
    featured: row.featured,
    experience: experienceFromSpaceRecord(row),
  };
}

export async function listPublishedCommunitySpaces(): Promise<CommunitySpace[]> {
  const rows = await prisma.communitySpaceRecord.findMany({
    where: { status: "published" },
    orderBy: communitySpaceListOrderBy,
  });
  const counts = await countPublishedPostsBySpaceIds(rows.map((r) => r.id));
  return rows.map((row) => ({
    ...communityRecordToSpace(row),
    postCount: counts[row.id] ?? 0,
  }));
}

/** Published space only — returns null for missing, draft, or archived slugs. */
export async function getPublishedCommunitySpaceBySlug(
  slug: string,
): Promise<CommunitySpace | null> {
  const detail = await getPublishedCommunitySpaceDetailBySlug(slug);
  if (!detail) return null;
  return {
    id: detail.id,
    slug: detail.slug,
    title: detail.title,
    description: detail.description,
    icon: detail.icon,
    status: detail.status as CommunitySpace["status"],
    postCount: detail.postCount,
    sortOrder: detail.sortOrder,
  };
}

/** Full space experience for storefront space pages. */
export async function getPublishedCommunitySpaceDetailBySlug(
  slug: string,
): Promise<CommunitySpaceDetail | null> {
  const row = await prisma.communitySpaceRecord.findUnique({
    where: { slug },
  });
  if (!row || row.status !== "published") return null;
  const counts = await countPublishedPostsBySpaceIds([row.id]);
  return recordToSpaceDetail(row, counts[row.id] ?? 0);
}

export async function getSpaceInteractionByPostId(
  postId: string,
): Promise<{
  slug: string;
  spaceType: string;
  allowComments: boolean;
  allowReactions: boolean;
  allowVoiceMessages: boolean;
  engagementPrompt: string | null;
} | null> {
  const post = await prisma.communityPostRecord.findFirst({
    where: { id: postId, status: "published", space: { status: "published" } },
    select: {
      space: {
        select: {
          slug: true,
          spaceType: true,
          allowComments: true,
          allowReactions: true,
          allowMemberPosts: true,
          allowVoiceMessages: true,
          engagementPrompt: true,
        },
      },
    },
  });
  if (!post) return null;
  const interaction = interactionFromSpaceRow(post.space);
  return {
    slug: post.space.slug,
    spaceType: interaction.spaceType,
    allowComments: interaction.allowComments,
    allowReactions: interaction.allowReactions,
    allowVoiceMessages: interaction.allowVoiceMessages,
    engagementPrompt: interaction.engagementPrompt,
  };
}

export async function listAllCommunitySpacesForAdmin(): Promise<CommunitySpaceRecord[]> {
  return prisma.communitySpaceRecord.findMany({
    orderBy: communitySpaceListOrderBy,
  });
}

export async function getCommunitySpaceById(id: string): Promise<CommunitySpaceRecord | null> {
  return prisma.communitySpaceRecord.findUnique({ where: { id } });
}
