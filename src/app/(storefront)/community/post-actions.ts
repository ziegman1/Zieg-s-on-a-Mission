"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import {
  formatMemberDisplayName,
  getMemberByUserId,
  resolveCommentMember,
} from "@/lib/community/members";
import { notifyPrayerRoomPostCreated } from "@/lib/community/notifications";
import { getCurrentCommunityOwner } from "@/lib/community/owner";
import {
  getPrayerRoomComposerPreset,
  parsePrayerRoomComposerKind,
  type PrayerRoomComposerKind,
} from "@/lib/community/prayer-room-composer";
import { autoExcerptFromBody } from "@/lib/community/post-constants";
import { isVoicePrayerBody } from "@/lib/community/prayer-response-body";
import { isPrayerSpaceSlug } from "@/lib/community/space-interaction";
import { canUseVoicePrayer } from "@/lib/community/voice-prayer";
import { getOrSetVisitorKey } from "@/lib/community/visitor-key";
import { prisma } from "@/lib/db";

const createPrayerRoomPostSchema = z.object({
  spaceId: z.string().uuid(),
  title: z.string().max(300).optional(),
  body: z.string().min(1).max(50000),
  postType: z.enum(["prayer", "praise", "encouragement"]),
  composerKind: z
    .enum(["prayer_request", "praise_report", "encouragement", "voice_prayer"])
    .optional(),
});

function memberMayPostInSpace(space: {
  allowMemberPosts: boolean;
  spaceType: string;
  slug: string;
}): boolean {
  if (space.allowMemberPosts) return true;
  return isPrayerSpaceSlug(space.slug) || space.spaceType === "prayer_room";
}

export async function createPrayerRoomPostAction(
  input: z.infer<typeof createPrayerRoomPostSchema>,
): Promise<
  | { ok: true; postId: string; spaceSlug: string }
  | { ok: false; error: string }
> {
  const parsed = createPrayerRoomPostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please complete your post before sharing." };
  }

  const { spaceId, title, body, postType, composerKind } = parsed.data;

  const space = await prisma.communitySpaceRecord.findFirst({
    where: { id: spaceId, status: "published" },
    select: {
      id: true,
      slug: true,
      spaceType: true,
      allowMemberPosts: true,
      allowVoiceMessages: true,
      settings: true,
    },
  });
  if (!space) return { ok: false, error: "This room is not available." };

  const kind: PrayerRoomComposerKind =
    parsePrayerRoomComposerKind(composerKind) ??
    (postType === "praise"
      ? "praise_report"
      : postType === "encouragement"
        ? "encouragement"
        : isVoicePrayerBody(body)
          ? "voice_prayer"
          : "prayer_request");

  if (isVoicePrayerBody(body) && !canUseVoicePrayer(space)) {
    return {
      ok: false,
      error: "Voice prayers are not enabled in this room. Share in writing instead.",
    };
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

  let authorUserId: string;
  let actorDisplayName: string;
  let actorMemberId: string | null = null;
  let actorIsOwner = false;

  if (resolved.mode === "owner") {
    authorUserId = owner!.id;
    actorDisplayName =
      owner!.name?.trim() || owner!.email?.split("@")[0] || "Mission Hub";
    actorIsOwner = true;
  } else {
    if (!memberMayPostInSpace(space)) {
      return { ok: false, error: "Posting is not open in this room yet." };
    }
    const member = resolved.member;
    if (!member.userId) {
      return {
        ok: false,
        error: "Sign in with your Mission Hub account to share here.",
      };
    }
    authorUserId = member.userId;
    actorDisplayName = formatMemberDisplayName(member.firstName, member.lastName);
    actorMemberId = member.id;
  }

  const memberProfile = await getMemberByUserId(authorUserId);
  if (memberProfile && memberProfile.status === "blocked") {
    return { ok: false, error: "Your account cannot post in Mission Hub." };
  }

  const preset = getPrayerRoomComposerPreset(kind);
  const excerpt = autoExcerptFromBody(body);

  try {
    const row = await prisma.communityPostRecord.create({
      data: {
        spaceId: space.id,
        authorUserId,
        title: title?.trim() || null,
        body: body.trim(),
        excerpt: excerpt ?? null,
        postType: preset.postType,
        status: "published",
        publishedAt: new Date(),
      },
    });

    await notifyPrayerRoomPostCreated({
      postId: row.id,
      kind,
      actorUserId: authorUserId,
      actorMemberId,
      actorDisplayName,
      actorIsOwner,
    }).catch((err) => console.error("[notifications] prayer room post:", err));

    revalidatePath("/community");
    revalidatePath(`/community/${space.slug}`);

    return { ok: true, postId: row.id, spaceSlug: space.slug };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Could not share your post. Please try again." };
  }
}
