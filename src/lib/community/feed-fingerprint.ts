import { hubAllFeedPostWhere } from "@/lib/community/feed-filters";
import { prisma } from "@/lib/db";

export type HubFeedFingerprint = {
  /** Stable string compared client-side to detect feed changes. */
  version: string;
  latestPostId: string | null;
  latestPublishedAt: string | null;
  publishedCount: number;
};

function buildVersion(
  latestPostId: string | null,
  latestPublishedAt: string | null,
  publishedCount: number,
): string {
  if (!latestPostId) return `empty:${publishedCount}`;
  return `${latestPostId}:${latestPublishedAt ?? ""}:${publishedCount}`;
}

/**
 * Lightweight feed snapshot for Mission Hub live refresh (all feed or one space).
 */
export async function getHubFeedFingerprint(
  spaceSlug?: string | null,
): Promise<HubFeedFingerprint> {
  try {
    const where =
      spaceSlug?.trim()
        ? {
            status: "published" as const,
            space: { slug: spaceSlug.trim().toLowerCase(), status: "published" as const },
          }
        : hubAllFeedPostWhere();

    const [latest, publishedCount] = await Promise.all([
      prisma.communityPostRecord.findFirst({
        where,
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        select: { id: true, publishedAt: true, createdAt: true },
      }),
      prisma.communityPostRecord.count({ where }),
    ]);

    const at = latest?.publishedAt ?? latest?.createdAt ?? null;
    const latestPublishedAt = at ? at.toISOString() : null;

    return {
      version: buildVersion(latest?.id ?? null, latestPublishedAt, publishedCount),
      latestPostId: latest?.id ?? null,
      latestPublishedAt,
      publishedCount,
    };
  } catch (e) {
    console.error("[community feed] getHubFeedFingerprint failed:", e);
    return {
      version: "empty:0",
      latestPostId: null,
      latestPublishedAt: null,
      publishedCount: 0,
    };
  }
}
