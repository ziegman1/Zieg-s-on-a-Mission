"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { isAdminRole } from "@/lib/admin-users";
import {
  createPublishedComment,
  isPublishedPostForComments,
  listPublishedCommentsForPost,
} from "@/lib/community/comments";
import {
  formatMemberDisplayName,
  getCommentAuthorContext,
  ownerCommentDisplayName,
  resolveCommentMember,
} from "@/lib/community/members";
import { getCurrentCommunityOwner } from "@/lib/community/owner";
import type { CommunityPostCommentThread } from "@/lib/community/types";
import { notifyCommentActivity } from "@/lib/community/notifications";
import {
  isVoicePrayerBody,
  parsePrayerResponseBody,
} from "@/lib/community/prayer-response-body";
import { canUseVoicePrayer } from "@/lib/community/voice-prayer";
import { getSpaceInteractionByPostId } from "@/lib/community/spaces";
import { getOrSetVisitorKey } from "@/lib/community/visitor-key";
import { prisma } from "@/lib/db";

const createSchema = z.object({
  postId: z.string().uuid(),
  body: z.string().min(1).max(4000),
  parentCommentId: z.string().uuid().optional().nullable(),
});

export async function loadPostCommentsAction(
  postId: string,
): Promise<
  | { ok: true; threads: CommunityPostCommentThread[] }
  | { ok: false; error: string }
> {
  if (!postId?.trim()) return { ok: false, error: "Invalid post" };
  const published = await isPublishedPostForComments(postId);
  if (!published) return { ok: false, error: "Comments are not available on this post" };

  try {
    const threads = await listPublishedCommentsForPost(postId);
    return { ok: true, threads };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Could not load comments" };
  }
}

export async function createPostCommentAction(
  input: z.infer<typeof createSchema>,
): Promise<
  | {
      ok: true;
      threads: CommunityPostCommentThread[];
      commentCount: number;
    }
  | { ok: false; error: string }
> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please write a comment" };
  }

  const { postId, body, parentCommentId } = parsed.data;
  const published = await isPublishedPostForComments(postId);
  if (!published) {
    return { ok: false, error: "Comments are not available on this post" };
  }

  const spaceRules = await getSpaceInteractionByPostId(postId);
  if (!spaceRules?.allowComments) {
    return { ok: false, error: "Comments are not open in this space." };
  }
  if (isVoicePrayerBody(body)) {
    if (!canUseVoicePrayer(spaceRules)) {
      return { ok: false, error: "Voice prayers are not enabled in this room." };
    }
    const parsed = parsePrayerResponseBody(body);
    if (parsed.kind === "voice" && !parsed.audioUrl.startsWith("http")) {
      return { ok: false, error: "Invalid voice prayer audio." };
    }
  }

  const [visitorKey, owner, session] = await Promise.all([
    getOrSetVisitorKey(),
    getCurrentCommunityOwner(),
    auth(),
  ]);

  const resolved = await resolveCommentMember({
    visitorKey,
    owner,
    sessionUserId: session?.user?.id ?? null,
    sessionRole: session?.user?.role,
  });

  if (resolved.mode === "unauthorized") {
    return { ok: false, error: resolved.message };
  }

  let displayName: string;
  let memberId: string | null = null;

  try {
    if (resolved.mode === "owner") {
      const user = await prisma.user.findUnique({
        where: { id: owner!.id },
        select: { name: true, email: true },
      });
      displayName = user?.name?.trim() || ownerCommentDisplayName(owner!);
    } else {
      displayName = formatMemberDisplayName(
        resolved.member.firstName,
        resolved.member.lastName,
      );
      memberId = resolved.member.id;
    }

    const { comment, commentCount } = await createPublishedComment({
      postId,
      visitorKey,
      displayName,
      body,
      memberId,
      parentCommentId: parentCommentId ?? null,
    });
    const threads = await listPublishedCommentsForPost(postId);

    await notifyCommentActivity({
      commentId: comment.id,
      postId,
      parentCommentId: parentCommentId ?? null,
      body,
      actorUserId: resolved.mode === "owner" ? owner!.id : (resolved.member.userId ?? null),
      actorMemberId: memberId,
      actorDisplayName: displayName,
      actorIsOwner: resolved.mode === "owner",
    }).catch((err) => console.error("[notifications] comment:", err));

    const post = await prisma.communityPostRecord.findFirst({
      where: { id: postId, status: "published", space: { status: "published" } },
      select: { space: { select: { slug: true } } },
    });
    revalidatePath("/community");
    if (post?.space.slug) revalidatePath(`/community/${post.space.slug}`);

    return {
      ok: true,
      threads,
      commentCount,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not post comment";
    return { ok: false, error: msg };
  }
}
