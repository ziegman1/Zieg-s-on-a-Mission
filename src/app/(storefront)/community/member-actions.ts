"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { createVisitorMemberProfileSchema } from "@/lib/community/member-form";
import {
  allowVisitorOnlyComments,
  createMemberForVisitor,
  getCommentAuthorContext,
  getCurrentCommunityMember,
  type CommunityMemberProfile,
} from "@/lib/community/members";
import { getCurrentCommunityOwner } from "@/lib/community/owner";
import { getOrSetVisitorKey } from "@/lib/community/visitor-key";

export async function getCommentAuthorContextAction(): Promise<
  Awaited<ReturnType<typeof getCommentAuthorContext>>
> {
  const [visitorKey, owner, session] = await Promise.all([
    getOrSetVisitorKey(),
    getCurrentCommunityOwner(),
    auth(),
  ]);
  return getCommentAuthorContext(
    visitorKey,
    owner,
    session?.user?.id ?? null,
    session?.user?.role,
  );
}

export async function getCurrentMemberProfileAction(): Promise<{
  member: CommunityMemberProfile | null;
}> {
  const member = await getCurrentCommunityMember();
  return { member };
}

/** Legacy visitor-only profile (only when MISSION_HUB_ALLOW_VISITOR_COMMENTS=1). */
export async function createVisitorMemberProfileAction(
  input: z.infer<typeof createVisitorMemberProfileSchema>,
): Promise<
  | { ok: true; member: CommunityMemberProfile }
  | { ok: false; error: string }
> {
  if (!allowVisitorOnlyComments()) {
    return { ok: false, error: "Join Mission Hub with an account to comment." };
  }

  const owner = await getCurrentCommunityOwner();
  if (owner) {
    return { ok: false, error: "Signed-in owners comment with their admin profile." };
  }

  const session = await auth();
  if (session?.user?.id) {
    return { ok: false, error: "You are signed in. Use your account to comment." };
  }

  const parsed = createVisitorMemberProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.flatten().formErrors.join(", ") || "Invalid profile details",
    };
  }

  const visitorKey = await getOrSetVisitorKey();

  try {
    const member = await createMemberForVisitor({
      visitorKey,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email?.trim() || null,
      profileImageUrl: parsed.data.profileImageUrl?.trim() || null,
    });
    revalidatePath("/community");
    return { ok: true, member };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not create profile";
    return { ok: false, error: msg };
  }
}
