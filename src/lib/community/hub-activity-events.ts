import "server-only";

import type { Prisma } from "@prisma/client";
import { startOfSiteDay } from "@/lib/community/site-timezone";
import { prisma } from "@/lib/db";

export const HUB_VISIT_EVENT_TYPE = "VISIT" as const;
export const HUB_VISIT_DEDUPE_MS = 15 * 60 * 1000;

const EXCLUDED_VISIT_PATHS = new Set(["/community/login", "/community/join"]);

export type RecordHubVisitInput = {
  path: string;
  memberId?: string | null;
  userId?: string | null;
  visitorKey?: string | null;
};

export type HubVisitStatsToday = {
  visitsToday: number;
  uniqueMembersVisitedToday: number;
};

export type RecentHubVisitor = {
  id: string;
  label: string;
  email: string | null;
  path: string | null;
  createdAt: string;
  isAnonymous: boolean;
};

export function shouldRecordHubVisit(path: string): boolean {
  if (!path.startsWith("/community")) return false;
  if (EXCLUDED_VISIT_PATHS.has(path)) return false;
  return true;
}

export function isShareHubPath(path: string): boolean {
  return path === "/community/share" || path.startsWith("/community/share/");
}

function visitIdentityFilter(input: RecordHubVisitInput): Prisma.CommunityHubActivityEventRecordWhereInput | null {
  if (input.memberId) return { memberId: input.memberId };
  if (input.userId) return { userId: input.userId, memberId: null };
  if (input.visitorKey) return { visitorKey: input.visitorKey, memberId: null, userId: null };
  return null;
}

/** Returns true when a new visit row was inserted. */
export async function recordCommunityHubVisit(input: RecordHubVisitInput): Promise<boolean> {
  const path = input.path.trim();
  if (!shouldRecordHubVisit(path)) return false;

  const memberId = input.memberId?.trim() || null;
  const userId = input.userId?.trim() || null;
  const visitorKey = input.visitorKey?.trim() || null;

  const hasSignedInIdentity = Boolean(memberId || userId);
  if (!hasSignedInIdentity && !visitorKey) return false;

  const identity = visitIdentityFilter({ path, memberId, userId, visitorKey });
  if (!identity) return false;

  const since = new Date(Date.now() - HUB_VISIT_DEDUPE_MS);
  const existing = await prisma.communityHubActivityEventRecord.findFirst({
    where: {
      eventType: HUB_VISIT_EVENT_TYPE,
      path,
      createdAt: { gte: since },
      ...identity,
    },
    select: { id: true },
  });
  if (existing) return false;

  const metadata: Record<string, unknown> = {};
  if (isShareHubPath(path)) metadata.sharePage = true;
  if (!memberId && !userId && visitorKey) metadata.anonymous = true;

  await prisma.communityHubActivityEventRecord.create({
    data: {
      eventType: HUB_VISIT_EVENT_TYPE,
      memberId,
      userId,
      visitorKey,
      path,
      metadata: metadata as Prisma.InputJsonValue,
    },
  });

  return true;
}

export async function getHubVisitStatsToday(now = Date.now()): Promise<HubVisitStatsToday> {
  const since = startOfSiteDay(now);

  const [visitsToday, memberGroups] = await Promise.all([
    prisma.communityHubActivityEventRecord.count({
      where: {
        eventType: HUB_VISIT_EVENT_TYPE,
        createdAt: { gte: since },
      },
    }),
    prisma.communityHubActivityEventRecord.groupBy({
      by: ["memberId"],
      where: {
        eventType: HUB_VISIT_EVENT_TYPE,
        createdAt: { gte: since },
        memberId: { not: null },
      },
    }),
  ]);

  return {
    visitsToday,
    uniqueMembersVisitedToday: memberGroups.length,
  };
}

function memberDisplayLabel(
  firstName: string,
  lastName: string,
  displayName: string | null,
): string {
  return (
    displayName?.trim() ||
    `${firstName.trim()} ${lastName.trim()}`.trim() ||
    "Member"
  );
}

export async function listRecentHubVisitors(limit = 8): Promise<RecentHubVisitor[]> {
  const rows = await prisma.communityHubActivityEventRecord.findMany({
    where: { eventType: HUB_VISIT_EVENT_TYPE },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      member: {
        select: {
          firstName: true,
          lastName: true,
          displayName: true,
          email: true,
          user: { select: { email: true } },
        },
      },
    },
  });

  return rows.map((row) => {
    const memberName = row.member
      ? memberDisplayLabel(
          row.member.firstName,
          row.member.lastName,
          row.member.displayName,
        )
      : null;
    const email = row.member?.user?.email ?? row.member?.email ?? null;
    const isAnonymous = !row.memberId;

    return {
      id: row.id,
      label: memberName ?? "Anonymous visitor",
      email,
      path: row.path,
      createdAt: row.createdAt.toISOString(),
      isAnonymous,
    };
  });
}
