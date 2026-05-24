import "server-only";

import { formatMemberDisplayName } from "@/lib/community/members";
import type {
  AdminMemberAvatarPreview,
  AdminMembersHubPreview,
} from "@/lib/community/admin-members-preview-types";
import { prisma } from "@/lib/db";

const AVATAR_STRIP_SIZE = 3;
const CANDIDATE_POOL = 12;

function memberDisplayName(row: {
  firstName: string;
  lastName: string;
  displayName: string | null;
}): string {
  return (
    row.displayName?.trim() ||
    formatMemberDisplayName(row.firstName, row.lastName) ||
    "Member"
  );
}

function pickAvatarStrip(
  rows: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string | null;
    profileImageUrl: string | null;
  }[],
): AdminMemberAvatarPreview[] {
  const withImage = rows.filter((r) => r.profileImageUrl?.trim());
  const withoutImage = rows.filter((r) => !r.profileImageUrl?.trim());
  const ordered = [...withImage, ...withoutImage].slice(0, AVATAR_STRIP_SIZE);

  return ordered.map((row) => ({
    id: row.id,
    displayName: memberDisplayName(row),
    profileImageUrl: row.profileImageUrl,
  }));
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Lightweight data for the Mission Hub admin member avatar strip (no full portal query). */
export async function getAdminMembersHubPreview(): Promise<AdminMembersHubPreview> {
  const today = startOfToday();

  const [totalMembers, activeToday, recentRows] = await Promise.all([
    prisma.communityMemberRecord.count({ where: { status: "active" } }),
    prisma.communityMemberRecord.count({
      where: {
        status: "active",
        OR: [
          { updatedAt: { gte: today } },
          { comments: { some: { createdAt: { gte: today } } } },
        ],
      },
    }),
    prisma.communityMemberRecord.findMany({
      where: { status: "active" },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: CANDIDATE_POOL,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        displayName: true,
        profileImageUrl: true,
      },
    }),
  ]);

  return {
    avatars: pickAvatarStrip(recentRows),
    totalMembers,
    activeToday,
  };
}
