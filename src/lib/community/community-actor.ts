import "server-only";

import { auth } from "@/auth";
import { isAdminRole } from "@/lib/admin-users";
import {
  formatCommunityActorDisplayName,
  memberNeedsUserLookup,
  resolveCommunityActorFromSources,
  shouldLoadMemberByUserId,
  type ResolvedCommunityActor,
} from "@/lib/community/community-actor-resolve";
import {
  getMemberByUserId,
  getMemberByVisitorKey,
  type CommunityMemberProfile,
} from "@/lib/community/members";
import { prisma } from "@/lib/db";

export type {
  CommunityActorNameFields,
  CommunityActorSourceInput,
  ResolvedCommunityActor,
} from "@/lib/community/community-actor-resolve";

export {
  formatCommunityActorDisplayName,
  resolveCommunityActorFromSources,
} from "@/lib/community/community-actor-resolve";

/** Resolve the current actor for reactions and similar interactions. */
export async function resolveCommunityActor(input: {
  visitorKey: string;
}): Promise<ResolvedCommunityActor> {
  const session = await auth();
  const sessionUserId = session?.user?.id ?? null;
  const sessionRole = session?.user?.role;

  let memberByUserId: CommunityMemberProfile | null = null;
  if (shouldLoadMemberByUserId(sessionUserId, sessionRole)) {
    memberByUserId = await getMemberByUserId(sessionUserId!);
  }

  const memberByVisitorKey =
    !memberByUserId && input.visitorKey?.trim()
      ? await getMemberByVisitorKey(input.visitorKey)
      : null;

  const resolvedMember = memberByUserId ?? memberByVisitorKey;
  let userRecord: { name: string | null; email: string | null } | null = null;

  const userIdForLookup =
    resolvedMember?.userId ??
    (sessionUserId && !isAdminRole(sessionRole) ? sessionUserId : null);

  if (userIdForLookup && (!resolvedMember || memberNeedsUserLookup(resolvedMember))) {
    userRecord = await prisma.user.findUnique({
      where: { id: userIdForLookup },
      select: { name: true, email: true },
    });
  }

  return resolveCommunityActorFromSources({
    sessionUserId,
    sessionRole,
    sessionName: session?.user?.name ?? null,
    sessionEmail: session?.user?.email ?? null,
    memberByUserId,
    memberByVisitorKey,
    userRecord,
  });
}

/** Batch-resolve reaction display names keyed by visitorKey (reaction details modal). */
export async function resolveReactionDisplayNamesByVisitorKeys(
  visitorKeys: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(visitorKeys.filter((k) => k?.trim()))];
  if (unique.length === 0) return new Map();

  const members = await prisma.communityMemberRecord.findMany({
    where: { visitorKey: { in: unique } },
    select: {
      visitorKey: true,
      userId: true,
      firstName: true,
      lastName: true,
      displayName: true,
      email: true,
    },
  });

  const userIds = members
    .map((m) => m.userId)
    .filter((id): id is string => Boolean(id));
  const users =
    userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
  const userById = new Map(users.map((u) => [u.id, u]));

  const result = new Map<string, string>();
  for (const member of members) {
    if (!member.visitorKey) continue;
    const user = member.userId ? (userById.get(member.userId) ?? null) : null;
    result.set(
      member.visitorKey,
      formatCommunityActorDisplayName(member, user),
    );
  }
  return result;
}

/** Re-resolve display name when initial resolution returned "Someone" but IDs exist. */
export async function refetchCommunityActorDisplayName(input: {
  actorDisplayName: string;
  actorMemberId: string | null;
  actorUserId: string | null;
}): Promise<string> {
  if (input.actorDisplayName !== "Someone") {
    return input.actorDisplayName;
  }

  if (input.actorMemberId) {
    const memberRow = await prisma.communityMemberRecord.findUnique({
      where: { id: input.actorMemberId },
      select: {
        displayName: true,
        firstName: true,
        lastName: true,
        email: true,
        userId: true,
      },
    });
    if (memberRow) {
      let userRecord: { name: string | null; email: string | null } | null = null;
      if (memberRow.userId) {
        userRecord = await prisma.user.findUnique({
          where: { id: memberRow.userId },
          select: { name: true, email: true },
        });
      }
      const name = formatCommunityActorDisplayName(memberRow, userRecord);
      if (name !== "Someone") return name;
    }
  }

  if (input.actorUserId) {
    const userRecord = await prisma.user.findUnique({
      where: { id: input.actorUserId },
      select: { name: true, email: true },
    });
    const name = formatCommunityActorDisplayName(null, userRecord);
    if (name !== "Someone") return name;
  }

  return "Someone";
}

/** @deprecated Use resolveCommunityActor — kept for existing imports. */
export async function resolveReactionActor(
  visitorKey: string,
): Promise<ResolvedCommunityActor> {
  return resolveCommunityActor({ visitorKey });
}
