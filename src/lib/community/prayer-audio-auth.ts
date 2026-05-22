import { auth } from "@/auth";
import { getCurrentCommunityOwner } from "@/lib/community/owner";
import { resolveCommentMember } from "@/lib/community/members";
import { getPublishedCommunitySpaceDetailBySlug } from "@/lib/community/spaces";
import { getSpaceInteractionByPostId } from "@/lib/community/spaces";
import { canUseVoicePrayer } from "@/lib/community/voice-prayer";
import { getOrSetVisitorKey } from "@/lib/community/visitor-key";

export type PrayerAudioUploadActor =
  | { mode: "owner" }
  | { mode: "member" };

/**
 * Owners and active Mission Hub members may upload voice prayer audio.
 * Optional postId enforces prayer space + allow_voice_messages when provided.
 */
export async function assertCanUploadPrayerAudio(
  postId?: string | null,
  spaceSlug?: string | null,
): Promise<
  | { ok: true; actor: PrayerAudioUploadActor }
  | { ok: false; status: number; error: string }
> {
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
    return { ok: false, status: 401, error: resolved.message };
  }

  if (postId?.trim()) {
    const rules = await getSpaceInteractionByPostId(postId.trim());
    if (!rules) {
      return { ok: false, status: 404, error: "Post not found" };
    }
    if (!canUseVoicePrayer(rules)) {
      return {
        ok: false,
        status: 403,
        error: "Voice prayers are not enabled in this room.",
      };
    }
  } else if (spaceSlug?.trim()) {
    const space = await getPublishedCommunitySpaceDetailBySlug(spaceSlug.trim());
    if (!space) {
      return { ok: false, status: 404, error: "Room not found" };
    }
    if (!canUseVoicePrayer(space.experience)) {
      return {
        ok: false,
        status: 403,
        error: "Voice prayers are not enabled in this room.",
      };
    }
  }

  return {
    ok: true,
    actor: resolved.mode === "owner" ? { mode: "owner" } : { mode: "member" },
  };
}
