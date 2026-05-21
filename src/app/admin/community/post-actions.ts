"use server";

import { revalidatePath } from "next/cache";
import {
  postAuthorUserSelect,
  resolvePostAuthor,
} from "@/lib/community/post-author";
import { COMMUNITY_POST_TYPES, DEFAULT_COMMUNITY_POST_TYPE } from "@/lib/community/post-constants";
import {
  communityPostInputSchema,
  type CommunityPostFormInput,
} from "@/lib/community/post-form";
import { postRecordToComposerForm } from "@/lib/community/post-composer-form";
import { requireCommunityOwner } from "@/lib/community/owner";
import {
  interactionFromSpaceRow,
  spaceExperienceSelect,
} from "@/lib/community/space-experience";
import type {
  CommunityPostFeedItemBase,
  CommunityPostType,
} from "@/lib/community/types";
import { prisma } from "@/lib/db";

const POST_TYPE_VALUES = new Set(COMMUNITY_POST_TYPES.map((t) => t.value));

function parsePostType(value: string | null | undefined): CommunityPostType {
  if (value && POST_TYPE_VALUES.has(value as CommunityPostType)) {
    return value as CommunityPostType;
  }
  return DEFAULT_COMMUNITY_POST_TYPE;
}

async function feedItemBaseForPostId(
  postId: string,
): Promise<CommunityPostFeedItemBase | null> {
  const row = await prisma.communityPostRecord.findUnique({
    where: { id: postId },
    include: {
      space: {
        select: { title: true, slug: true, status: true, ...spaceExperienceSelect },
      },
      authorUser: { select: postAuthorUserSelect },
    },
  });
  if (!row) return null;
  const publishedAt = row.publishedAt ?? row.createdAt;
  const author = resolvePostAuthor(row.authorUser);
  const interaction = interactionFromSpaceRow(row.space);
  return {
    id: row.id,
    spaceId: row.spaceId,
    spaceTitle: row.space.title,
    spaceSlug: row.space.slug,
    title: row.title,
    body: row.body,
    excerpt: row.excerpt,
    postType: parsePostType(row.postType),
    coverImageUrl: row.coverImageUrl,
    publishedAt: publishedAt.toISOString(),
    authorName: author.authorName,
    authorImageUrl: author.authorImageUrl,
    authorAvatarName: author.authorAvatarName,
    spaceAllowComments: interaction.allowComments,
    spaceAllowReactions: interaction.allowReactions,
    spaceAllowVoiceMessages: interaction.allowVoiceMessages,
    spaceEngagementPrompt: interaction.engagementPrompt,
    spaceType: interaction.spaceType,
  };
}

function parsePublishedAt(status: string, raw?: string): Date | null {
  if (status !== "published") return null;
  if (raw?.trim()) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

async function revalidatePosts(spaceSlug?: string | null) {
  revalidatePath("/community");
  revalidatePath("/admin/community");
  revalidatePath("/admin/community/posts");
  if (spaceSlug) revalidatePath(`/community/${spaceSlug}`);
}

export async function createCommunityPostAction(
  input: CommunityPostFormInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const owner = await requireCommunityOwner();
  if (!owner) return { ok: false, error: "Unauthorized" };

  const parsed = communityPostInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.flatten().formErrors.join(", ") || "Invalid input" };
  }

  const data = parsed.data;
  const space = await prisma.communitySpaceRecord.findUnique({
    where: { id: data.spaceId },
    select: { slug: true },
  });
  if (!space) return { ok: false, error: "Space not found" };

  try {
    const row = await prisma.communityPostRecord.create({
      data: {
        spaceId: data.spaceId,
        authorUserId: owner.id,
        title: data.title?.trim() || null,
        body: data.body.trim(),
        excerpt: data.excerpt?.trim() || null,
        postType: data.postType,
        status: data.status,
        coverImageUrl: data.coverImageUrl?.trim() || null,
        publishedAt: parsePublishedAt(data.status, data.publishedAt),
      },
    });
    await revalidatePosts(space.slug);
    return { ok: true, id: row.id };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Could not create post. Is the database migrated?" };
  }
}

export async function loadCommunityPostForEditAction(
  postId: string,
): Promise<
  | {
      ok: true;
      form: ReturnType<typeof postRecordToComposerForm>;
      status: string;
    }
  | { ok: false; error: string }
> {
  const owner = await requireCommunityOwner();
  if (!owner) return { ok: false, error: "Unauthorized" };

  if (!postId?.trim()) return { ok: false, error: "Invalid post" };

  const row = await prisma.communityPostRecord.findUnique({
    where: { id: postId },
    select: {
      spaceId: true,
      title: true,
      body: true,
      excerpt: true,
      postType: true,
      status: true,
      coverImageUrl: true,
      publishedAt: true,
    },
  });
  if (!row) return { ok: false, error: "Post not found" };

  return {
    ok: true,
    form: postRecordToComposerForm(row),
    status: row.status,
  };
}

export async function updateCommunityPostAction(
  id: string,
  input: CommunityPostFormInput,
): Promise<
  | { ok: true; feedPatch: CommunityPostFeedItemBase | null; visibleInPublishedFeed: boolean }
  | { ok: false; error: string }
> {
  const owner = await requireCommunityOwner();
  if (!owner) return { ok: false, error: "Unauthorized" };

  const parsed = communityPostInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.flatten().formErrors.join(", ") || "Invalid input" };
  }

  const data = parsed.data;
  const existing = await prisma.communityPostRecord.findUnique({
    where: { id },
    include: { space: { select: { slug: true } } },
  });
  if (!existing) return { ok: false, error: "Post not found" };

  const newSpace = await prisma.communitySpaceRecord.findUnique({
    where: { id: data.spaceId },
    select: { slug: true, status: true },
  });
  if (!newSpace) return { ok: false, error: "Space not found" };

  const publishedAt =
    data.status === "published"
      ? parsePublishedAt(data.status, data.publishedAt) ?? existing.publishedAt ?? new Date()
      : null;

  try {
    await prisma.communityPostRecord.update({
      where: { id },
      data: {
        spaceId: data.spaceId,
        title: data.title?.trim() || null,
        body: data.body.trim(),
        excerpt: data.excerpt?.trim() || null,
        postType: data.postType,
        status: data.status,
        coverImageUrl: data.coverImageUrl?.trim() || null,
        publishedAt,
      },
    });
    await revalidatePosts(existing.space.slug);
    if (newSpace.slug !== existing.space.slug) {
      await revalidatePosts(newSpace.slug);
    }
    const feedPatch = await feedItemBaseForPostId(id);
    const visibleInPublishedFeed =
      data.status === "published" && newSpace.status === "published";
    return { ok: true, feedPatch, visibleInPublishedFeed };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Could not update post." };
  }
}

export async function unpublishCommunityPostAction(
  id: string,
): Promise<{ ok: true; removedFromFeed: true } | { ok: false; error: string }> {
  const owner = await requireCommunityOwner();
  if (!owner) return { ok: false, error: "Unauthorized" };

  const existing = await prisma.communityPostRecord.findUnique({
    where: { id },
    include: { space: { select: { slug: true } } },
  });
  if (!existing) return { ok: false, error: "Post not found" };

  try {
    await prisma.communityPostRecord.update({
      where: { id },
      data: { status: "draft", publishedAt: null },
    });
    await revalidatePosts(existing.space.slug);
    return { ok: true, removedFromFeed: true };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Could not unpublish post." };
  }
}

export async function archiveCommunityPostAction(
  id: string,
): Promise<{ ok: true; removedFromFeed: true } | { ok: false; error: string }> {
  const owner = await requireCommunityOwner();
  if (!owner) return { ok: false, error: "Unauthorized" };

  try {
    const existing = await prisma.communityPostRecord.findUnique({
      where: { id },
      include: { space: { select: { slug: true } } },
    });
    if (!existing) return { ok: false, error: "Post not found" };

    await prisma.communityPostRecord.update({
      where: { id },
      data: { status: "archived" },
    });
    await revalidatePosts(existing.space.slug);
    return { ok: true, removedFromFeed: true };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Could not archive post." };
  }
}
