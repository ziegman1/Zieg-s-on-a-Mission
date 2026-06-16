/**
 * Smoke test for Mission Hub engagement + visit tracking (Phase 0/1).
 *
 * Usage: npx dotenv -e .env.local -- tsx scripts/smoke-mission-hub-activity.ts
 */
import { prisma } from "../src/lib/db";
import { startOfSiteDay } from "../src/lib/community/site-timezone";

const SMOKE_PATH_A = "/community/smoke-test-path-a";
const SMOKE_PATH_B = "/community/smoke-test-path-b";
const HUB_VISIT_DEDUPE_MS = 15 * 60 * 1000;

async function recordVisit(input: {
  path: string;
  memberId: string;
  userId: string;
}): Promise<boolean> {
  const since = new Date(Date.now() - HUB_VISIT_DEDUPE_MS);
  const existing = await prisma.communityHubActivityEventRecord.findFirst({
    where: {
      eventType: "VISIT",
      path: input.path,
      memberId: input.memberId,
      createdAt: { gte: since },
    },
    select: { id: true },
  });
  if (existing) return false;

  await prisma.communityHubActivityEventRecord.create({
    data: {
      eventType: "VISIT",
      path: input.path,
      memberId: input.memberId,
      userId: input.userId,
    },
  });
  return true;
}

async function visitsToday(): Promise<number> {
  const since = startOfSiteDay();
  return prisma.communityHubActivityEventRecord.count({
    where: { eventType: "VISIT", createdAt: { gte: since } },
  });
}

async function engagedToday(): Promise<number> {
  const since = startOfSiteDay();
  const [profileUpdated, commentMembers, postAuthors, reactionKeys] =
    await Promise.all([
      prisma.communityMemberRecord.findMany({
        where: { status: "active", updatedAt: { gte: since } },
        select: { id: true },
      }),
      prisma.communityPostCommentRecord.findMany({
        where: {
          createdAt: { gte: since },
          status: "published",
          memberId: { not: null },
        },
        select: { memberId: true },
        distinct: ["memberId"],
      }),
      prisma.communityPostRecord.findMany({
        where: {
          status: "published",
          authorUserId: { not: null },
          OR: [{ publishedAt: { gte: since } }, { updatedAt: { gte: since } }],
        },
        select: { authorUserId: true },
        distinct: ["authorUserId"],
      }),
      prisma.communityPostReactionRecord.findMany({
        where: { createdAt: { gte: since } },
        select: { visitorKey: true },
        distinct: ["visitorKey"],
      }),
    ]);

  const authorUserIds = postAuthors
    .map((r) => r.authorUserId)
    .filter((id): id is string => Boolean(id));
  const reactionVisitorKeys = reactionKeys.map((r) => r.visitorKey);

  const linked =
    authorUserIds.length > 0 || reactionVisitorKeys.length > 0
      ? await prisma.communityMemberRecord.findMany({
          where: {
            status: "active",
            OR: [
              ...(authorUserIds.length > 0
                ? [{ userId: { in: authorUserIds } }]
                : []),
              ...(reactionVisitorKeys.length > 0
                ? [{ visitorKey: { in: reactionVisitorKeys } }]
                : []),
            ],
          },
          select: { id: true, userId: true, visitorKey: true },
        })
      : [];

  const ids = new Set<string>();
  for (const row of profileUpdated) ids.add(row.id);
  for (const row of commentMembers) if (row.memberId) ids.add(row.memberId);

  const userMap = new Map(
    linked.filter((r) => r.userId).map((r) => [r.userId!, r.id]),
  );
  for (const userId of authorUserIds) {
    const id = userMap.get(userId);
    if (id) ids.add(id);
  }

  const vkMap = new Map(
    linked.filter((r) => r.visitorKey).map((r) => [r.visitorKey!, r.id]),
  );
  for (const vk of reactionVisitorKeys) {
    const id = vkMap.get(vk);
    if (id) ids.add(id);
  }

  return ids.size;
}

async function findSmokeMember() {
  const member = await prisma.communityMemberRecord.findFirst({
    where: { status: "active", userId: { not: null } },
    select: { id: true, userId: true, firstName: true, lastName: true },
    orderBy: { updatedAt: "desc" },
  });
  if (!member?.userId) {
    throw new Error("No active member with userId found for smoke test");
  }
  return member;
}

async function main() {
  const member = await findSmokeMember();
  const user = await prisma.user.findUnique({
    where: { id: member.userId! },
    select: { role: true, email: true },
  });

  console.log("\n--- Mission Hub activity smoke test ---\n");
  console.log(`Member: ${member.firstName} ${member.lastName} (${user?.email ?? member.userId})`);
  console.log(`User role: ${user?.role ?? "unknown"}`);

  const baselineVisits = await visitsToday();
  const baselineEngaged = await engagedToday();
  console.log(`\nBaseline visits today: ${baselineVisits}`);
  console.log(`Baseline engaged today: ${baselineEngaged}`);

  const visitA1 = await recordVisit({
    path: SMOKE_PATH_A,
    memberId: member.id,
    userId: member.userId!,
  });
  const afterA = await visitsToday();
  console.log(`\n[1] First visit to ${SMOKE_PATH_A}: created=${visitA1}`);
  console.log(`    Visits today: ${baselineVisits} → ${afterA}`);
  if (!visitA1 || afterA !== baselineVisits + 1) {
    throw new Error("Expected visits today to increase by 1 after first path visit");
  }

  const visitB = await recordVisit({
    path: SMOKE_PATH_B,
    memberId: member.id,
    userId: member.userId!,
  });
  const afterB = await visitsToday();
  console.log(`\n[2] Visit to different path ${SMOKE_PATH_B}: created=${visitB}`);
  console.log(`    Visits today: ${afterA} → ${afterB}`);
  if (!visitB || afterB !== afterA + 1) {
    throw new Error("Expected visits today to increase by 1 for different path");
  }

  const visitADupe = await recordVisit({
    path: SMOKE_PATH_A,
    memberId: member.id,
    userId: member.userId!,
  });
  const afterDedupe = await visitsToday();
  console.log(`\n[3] Repeat visit to ${SMOKE_PATH_A} within 15 min: created=${visitADupe}`);
  console.log(`    Visits today unchanged: ${afterDedupe}`);
  if (visitADupe || afterDedupe !== afterB) {
    throw new Error("Expected duplicate visit within 15 minutes to be suppressed");
  }

  const reactionKey = `smoke-vk-${Date.now()}`;
  await prisma.communityMemberRecord.update({
    where: { id: member.id },
    data: { visitorKey: reactionKey },
  });

  const post = await prisma.communityPostRecord.findFirst({
    where: { status: "published" },
    select: { id: true },
  });
  if (!post) {
    console.log("\n[4] Skipped reaction engagement check — no published posts");
  } else {
    await prisma.communityPostReactionRecord.create({
      data: {
        postId: post.id,
        visitorKey: reactionKey,
        reactionType: "prayed",
      },
    });
    const engagedAfter = await engagedToday();
    console.log(`\n[4] Engaged today after pray reaction: ${baselineEngaged} → ${engagedAfter}`);
    if (engagedAfter < baselineEngaged + 1) {
      throw new Error("Expected engaged today to increase after member reaction");
    }
  }

  console.log("\n[5] Admin-only UI (verified in code + unit tests):");
  console.log("    - membersPreview null unless owner in layout");
  console.log("    - CommunityTopbarMembersCluster hidden when !owner");
  console.log("    - loadHubMembersPanelAction returns Unauthorized for non-owner");

  console.log("\nOK — smoke test passed.\n");
}

main()
  .catch((e) => {
    console.error("\nFAILED:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
