"use server";

import { revalidatePath } from "next/cache";
import {
  isCommunityReactionType,
  isPublishedPostForReactions,
  togglePostReaction,
} from "@/lib/community/reactions";
import { notifyReactionAdded, resolveReactionActor } from "@/lib/community/notifications";
import type { CommunityReactionType } from "@/lib/community/types";
import { getSpaceInteractionByPostId } from "@/lib/community/spaces";
import { getOrSetVisitorKey } from "@/lib/community/visitor-key";
import { prisma } from "@/lib/db";

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
      await notifyReactionAdded({
        postId,
        reactionType,
        ...actor,
      }).catch((err) => console.error("[notifications] reaction:", err));
    }
    const post = await prisma.communityPostRecord.findFirst({
      where: { id: postId, status: "published", space: { status: "published" } },
      select: { space: { select: { slug: true } } },
    });
    revalidatePath("/community");
    if (post?.space.slug) revalidatePath(`/community/${post.space.slug}`);
    const { added: _added, ...payload } = result;
    return { ok: true, ...payload };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Could not update reaction" };
  }
}
