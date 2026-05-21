import { hash } from "bcryptjs";
import type { UserRole } from "@prisma/client";
import { prismaForCredentialsAuth } from "@/lib/prisma-credentials";
import { formatMemberDisplayName } from "@/lib/community/members";
import { notifyMemberJoined } from "@/lib/community/notifications";
import type { JoinCommunityInput } from "@/lib/community/member-form";

export async function emailExistsForAccount(email: string): Promise<boolean> {
  const prisma = prismaForCredentialsAuth();
  const user = await prisma.user.findFirst({
    where: { email: { equals: email.trim(), mode: "insensitive" } },
    select: { id: true },
  });
  return Boolean(user);
}

/**
 * Create User (CUSTOMER) + linked community_members row.
 * Uses direct Prisma client for transactional signup.
 */
export async function createCommunityAccount(input: JoinCommunityInput & {
  visitorKey?: string | null;
}): Promise<{ userId: string; memberId: string }> {
  const email = input.email.trim().toLowerCase();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const fullName = formatMemberDisplayName(firstName, lastName);
  const passwordHash = await hash(input.password, 10);
  const profileImageUrl = input.profileImageUrl?.trim() || null;

  const prisma = prismaForCredentialsAuth();

  if (await emailExistsForAccount(email)) {
    throw new Error("An account with this email already exists. Sign in instead.");
  }

  const role: UserRole = "CUSTOMER";

  const user = await prisma.user.create({
    data: {
      email,
      name: fullName,
      image: profileImageUrl,
      passwordHash,
      role,
    },
  });

  try {
    const member = await prisma.communityMemberRecord.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
        email,
        profileImageUrl,
        visitorKey: input.visitorKey ?? null,
        status: "active",
      },
    });
    await notifyMemberJoined({
      memberId: member.id,
      userId: user.id,
      displayName: fullName,
    }).catch((err) => console.error("[notifications] member_joined:", err));

    return { userId: user.id, memberId: member.id };
  } catch (e) {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    throw e;
  }
}
