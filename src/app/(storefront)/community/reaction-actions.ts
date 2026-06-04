"use server";

import { revalidatePath } from "next/cache";
import {
  isCommunityReactionType,
  isPublishedPostForReactions,
  listPostReactionDetails,
  setPostReaction,
  togglePostReaction,
} from "@/lib/community/reactions";
import { notifyReactionAdded, resolveReactionActor } from "@/lib/community/notifications";
import { syncMemberVisitorKeyForMember } from "@/lib/community/members";
import type { CommunityReactionType } from "@/lib/community/types";
import { getSpaceInteractionByPostId } from "@/lib/community/spaces";
import { getOrSetVisitorKey } from "@/lib/community/visitor-key";
import { prisma } from "@/lib/db";

async function revalidatePostPaths(postId: string) {
  const post = await prisma.communityPostRecord.findFirst({
    where: { id: postId, status: "published", space: { status: "published" } },
    select: { space: { select: { slug: true } } },
  });
  revalidatePath("/community");
  if (post?.space.slug) revalidatePath(`/community/${post.space.slug}`);
}

export async function toggleCommunityPostReactionAction(
  postId: string,
  reactionType: string,
): Promise<
  | {
      ok: true;
      counts: Record<CommunityReactionType, number>;
      myReactions: CommunityReactionType[];
    }
  | { ok: false; error: string }
> {
  if (!postId?.trim()) return { ok: false, error: "Invalid post" };
  if (!isCommunityReactionType(reactionType)) {
    return { ok: false, error: "Invalid reaction" };
  }

  const published = await isPublishedPostForReactions(postId);
  if (!published) {
    return { ok: false, error: "This post is not available for reactions" };
  }

  const spaceRules = await getSpaceInteractionByPostId(postId);
  if (!spaceRules?.allowReactions) {
    return { ok: false, error: "Reactions are not open in this space." };
  }

  const visitorKey = await getOrSetVisitorKey();

  try {
    const result = await togglePostReaction(postId, visitorKey, reactionType);
    if (result.added) {
      const actor = await resolveReactionActor(visitorKey);
      if (actor.actorMemberId) {
        await syncMemberVisitorKeyForMember(actor.actorMemberId, visitorKey).catch(
          (err) => console.error("[reactions] visitorKey sync:", err),
        );
      }
      await notifyReactionAdded({
        postId,
        reactionType,
        ...actor,
      }).catch((err) => console.error("[notifications] reaction:", err));
    }
    await revalidatePostPaths(postId);
    const { added: _added, ...payload } = result;
    return { ok: true, ...payload };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Could not update reaction" };
  }
}

/** Single-choice reaction (standard / non-prayer spaces). */
export async function setCommunityPostReactionAction(
  postId: string,
  reactionType: string,
): Promise<
  | {
      ok: true;
      counts: Record<CommunityReactionType, number>;
      myReactions: CommunityReactionType[];
      active: boolean;
    }
  | { ok: false; error: string }
> {
  if (!postId?.trim()) return { ok: false, error: "Invalid post" };
  if (!isCommunityReactionType(reactionType)) {
    return { ok: false, error: "Invalid reaction" };
  }

  const published = await isPublishedPostForReactions(postId);
  if (!published) {
    return { ok: false, error: "This post is not available for reactions" };
  }

  const spaceRules = await getSpaceInteractionByPostId(postId);
  if (!spaceRules?.allowReactions) {
    return { ok: false, error: "Reactions are not open in this space." };
  }

  const visitorKey = await getOrSetVisitorKey();

  try {
    const result = await setPostReaction(postId, visitorKey, reactionType);
    if (result.added) {
      const actor = await resolveReactionActor(visitorKey);
      if (actor.actorMemberId) {
        await syncMemberVisitorKeyForMember(actor.actorMemberId, visitorKey).catch(
          (err) => console.error("[reactions] visitorKey sync:", err),
        );
      }
      await notifyReactionAdded({
        postId,
        reactionType,
        ...actor,
      }).catch((err) => console.error("[notifications] reaction:", err));
    }
    await revalidatePostPaths(postId);
    const { added: _added, active, ...payload } = result;
    return { ok: true, active, ...payload };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Could not update reaction" };
  }
}

export async function listCommunityPostReactionsAction(
  postId: string,
): Promise<
  | { ok: true; items: Awaited<ReturnType<typeof listPostReactionDetails>> }
  | { ok: false; error: string }
> {
  if (!postId?.trim()) return { ok: false, error: "Invalid post" };
  const published = await isPublishedPostForReactions(postId);
  if (!published) return { ok: false, error: "Post not found" };

  try {
    const items = await listPostReactionDetails(postId);
    return { ok: true, items };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Could not load reactions" };
  }
}
