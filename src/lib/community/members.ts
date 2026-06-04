import type { CommunityMemberRecord } from "@prisma/client";
import { auth } from "@/auth";
import { isCommunityMemberRole } from "@/lib/auth-roles";
import type { CommunityOwner } from "@/lib/community/owner-types";
import type { CommunityMemberStatus } from "@/lib/community/member-form";
import { prisma } from "@/lib/db";

export type CommunityMemberProfile = {
  id: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  displayName: string | null;
  bio: string | null;
  email: string | null;
  profileImageUrl: string | null;
  status: CommunityMemberStatus;
};

export type CommentAuthorContext =
  | {
      kind: "owner";
      displayName: string;
      profileImageUrl: string | null;
    }
  | {
      kind: "member";
      member: CommunityMemberProfile;
    }
  | { kind: "guest" }
  | {
      kind: "visitor";
      member: CommunityMemberProfile;
    };

/** When true, legacy visitor_key profiles may comment without a User account. */
export function allowVisitorOnlyComments(): boolean {
  return process.env.MISSION_HUB_ALLOW_VISITOR_COMMENTS === "1";
}

export function formatMemberDisplayName(
  firstName: string,
  lastName: string,
): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

export function isCommunityMemberStatus(value: string): value is CommunityMemberStatus {
  return value === "active" || value === "pending" || value === "blocked";
}

function recordToProfile(row: CommunityMemberRecord): CommunityMemberProfile {
  return {
    id: row.id,
    userId: row.userId,
    firstName: row.firstName,
    lastName: row.lastName,
    displayName: row.displayName,
    bio: row.bio,
    email: row.email,
    profileImageUrl: row.profileImageUrl,
    status: isCommunityMemberStatus(row.status) ? row.status : "active",
  };
}

export function ownerCommentDisplayName(owner: CommunityOwner): string {
  const name = owner.name?.trim();
  if (name) return name;
  const email = owner.email?.trim();
  if (email) return email.split("@")[0] ?? "Owner";
  return "Mission Hub Owner";
}

export async function getMemberByUserId(
  userId: string,
): Promise<CommunityMemberProfile | null> {
  const row = await prisma.communityMemberRecord.findUnique({
    where: { userId },
  });
  return row ? recordToProfile(row) : null;
}

export async function getMemberByVisitorKey(
  visitorKey: string,
): Promise<CommunityMemberProfile | null> {
  const row = await prisma.communityMemberRecord.findUnique({
    where: { visitorKey },
  });
  return row ? recordToProfile(row) : null;
}

/** Signed-in CUSTOMER with linked community_members row. */
export async function getCurrentCommunityMember(): Promise<CommunityMemberProfile | null> {
  const session = await auth();
  if (!session?.user?.id || !isCommunityMemberRole(session.user.role)) {
    return null;
  }
  return getMemberByUserId(session.user.id);
}

export async function getCommentAuthorContext(
  visitorKey: string,
  owner: CommunityOwner | null,
  sessionUserId: string | null,
  sessionRole: string | undefined,
): Promise<CommentAuthorContext> {
  if (owner) {
    const user = await prisma.user.findUnique({
      where: { id: owner.id },
      select: { image: true, name: true, email: true },
    });
    return {
      kind: "owner",
      displayName: user?.name?.trim() || ownerCommentDisplayName(owner),
      profileImageUrl: user?.image ?? null,
    };
  }

  if (sessionUserId && isCommunityMemberRole(sessionRole)) {
    const member = await getMemberByUserId(sessionUserId);
    if (member) return { kind: "member", member };
    return { kind: "guest" };
  }

  if (allowVisitorOnlyComments()) {
    const visitorMember = await getMemberByVisitorKey(visitorKey);
    if (visitorMember) return { kind: "visitor", member: visitorMember };
  }

  return { kind: "guest" };
}

export async function assertMemberCanComment(
  member: CommunityMemberProfile,
): Promise<void> {
  if (member.status === "blocked") {
    throw new Error("Your Mission Hub account has been blocked from commenting.");
  }
  if (member.status !== "active") {
    throw new Error("Your account is not active yet. Please try again later.");
  }
}

/** Resolve member for posting a comment (account-based or legacy visitor). */
export async function resolveCommentMember(input: {
  visitorKey: string;
  sessionUserId: string | null;
  sessionRole: string | undefined;
  owner: CommunityOwner | null;
}): Promise<
  | { mode: "owner" }
  | { mode: "member"; member: CommunityMemberProfile }
  | { mode: "unauthorized"; message: string }
> {
  if (input.owner) return { mode: "owner" };

  if (input.sessionUserId && isCommunityMemberRole(input.sessionRole)) {
    const member = await getMemberByUserId(input.sessionUserId);
    if (!member) {
      return {
        mode: "unauthorized",
        message: "Complete your Mission Hub profile before commenting.",
      };
    }
    try {
      await assertMemberCanComment(member);
    } catch (e) {
      return {
        mode: "unauthorized",
        message: e instanceof Error ? e.message : "Cannot comment",
      };
    }
    return { mode: "member", member };
  }

  if (allowVisitorOnlyComments()) {
    const visitorMember = await getMemberByVisitorKey(input.visitorKey);
    if (visitorMember) {
      try {
        await assertMemberCanComment(visitorMember);
        return { mode: "member", member: visitorMember };
      } catch (e) {
        return {
          mode: "unauthorized",
          message: e instanceof Error ? e.message : "Cannot comment",
        };
      }
    }
  }

  return {
    mode: "unauthorized",
    message: "Join Mission Hub to comment.",
  };
}

export async function createMemberForVisitor(input: {
  visitorKey: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  profileImageUrl?: string | null;
}): Promise<CommunityMemberProfile> {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  if (!firstName || !lastName) throw new Error("First and last name are required");

  const email = input.email?.trim() || null;

  const existing = await prisma.communityMemberRecord.findUnique({
    where: { visitorKey: input.visitorKey },
  });
  if (existing) {
    const profile = recordToProfile(existing);
    await assertMemberCanComment(profile);
    return profile;
  }

  try {
    const row = await prisma.communityMemberRecord.create({
      data: {
        firstName,
        lastName,
        email,
        profileImageUrl: input.profileImageUrl?.trim() || null,
        visitorKey: input.visitorKey,
        status: "active",
      },
    });
    return recordToProfile(row);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Unique constraint") && msg.includes("email")) {
      throw new Error("That email is already linked to another profile.");
    }
    if (msg.includes("Unique constraint") && msg.includes("visitor_key")) {
      const again = await getMemberByVisitorKey(input.visitorKey);
      if (again) return again;
    }
    throw e;
  }
}

export type AdminCommunityMemberRow = {
  id: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  userEmail: string | null;
  profileImageUrl: string | null;
  visitorKey: string | null;
  status: CommunityMemberStatus;
  createdAt: string;
  commentCount: number;
};

export async function listMembersForAdmin(): Promise<AdminCommunityMemberRow[]> {
  const rows = await prisma.communityMemberRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      user: { select: { email: true } },
      _count: { select: { comments: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    userEmail: row.user?.email ?? null,
    profileImageUrl: row.profileImageUrl,
    visitorKey: row.visitorKey,
    status: isCommunityMemberStatus(row.status) ? row.status : "active",
    createdAt: row.createdAt.toISOString(),
    commentCount: row._count.comments,
  }));
}

export async function setMemberStatusForAdmin(
  memberId: string,
  status: "active" | "blocked",
): Promise<boolean> {
  const existing = await prisma.communityMemberRecord.findUnique({
    where: { id: memberId },
    select: { id: true },
  });
  if (!existing) return false;
  await prisma.communityMemberRecord.update({
    where: { id: memberId },
    data: { status },
  });
  return true;
}

export async function updateMemberProfileForUser(
  userId: string,
  input: {
    firstName: string;
    lastName: string;
    displayName?: string | null;
    bio?: string | null;
    profileImageUrl?: string | null;
  },
): Promise<CommunityMemberProfile> {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const displayName = input.displayName?.trim() || null;
  const bio = input.bio?.trim() || null;
  const fullName =
    displayName || formatMemberDisplayName(firstName, lastName);
  const profileImageUrl = input.profileImageUrl?.trim() || null;

  const member = await prisma.communityMemberRecord.findUnique({
    where: { userId },
  });
  if (!member) throw new Error("Mission Hub profile not found");

  const [updated] = await prisma.$transaction([
    prisma.communityMemberRecord.update({
      where: { id: member.id },
      data: { firstName, lastName, displayName, bio, profileImageUrl },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { name: fullName, image: profileImageUrl },
    }),
  ]);

  return recordToProfile(updated);
}

export async function updateOwnerUserProfile(
  userId: string,
  input: { name: string; image?: string | null },
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name.trim() || null,
      image: input.image?.trim() || null,
    },
  });
}

/** Keep member visitorKey aligned with the current browser cookie after sign-in or reactions. */
export async function syncMemberVisitorKeyForUser(
  userId: string,
  visitorKey: string,
): Promise<void> {
  const key = visitorKey.trim();
  if (!key) return;

  const member = await prisma.communityMemberRecord.findUnique({
    where: { userId },
    select: { id: true, visitorKey: true },
  });
  if (!member || member.visitorKey === key) return;

  const conflict = await prisma.communityMemberRecord.findUnique({
    where: { visitorKey: key },
    select: { id: true },
  });
  if (conflict && conflict.id !== member.id) return;

  await prisma.communityMemberRecord.update({
    where: { id: member.id },
    data: { visitorKey: key },
  });
}

export async function syncMemberVisitorKeyForMember(
  memberId: string,
  visitorKey: string,
): Promise<void> {
  const key = visitorKey.trim();
  if (!key) return;

  const member = await prisma.communityMemberRecord.findUnique({
    where: { id: memberId },
    select: { id: true, visitorKey: true },
  });
  if (!member || member.visitorKey === key) return;

  const conflict = await prisma.communityMemberRecord.findUnique({
    where: { visitorKey: key },
    select: { id: true },
  });
  if (conflict && conflict.id !== member.id) return;

  await prisma.communityMemberRecord.update({
    where: { id: member.id },
    data: { visitorKey: key },
  });
}
