import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

/** Prisma order for every public/admin space list */
export const communitySpaceListOrderBy = [
  { sortOrder: "asc" as const },
  { createdAt: "asc" as const },
];

const DEFAULT_FIRST_SLUGS = new Set(["start-here", "welcome"]);

export function isDefaultFirstSpaceSlug(slug: string): boolean {
  const s = slug.toLowerCase();
  return DEFAULT_FIRST_SLUGS.has(s) || s.includes("start-here");
}

/** Sort in-memory rows the same way as DB lists */
export function sortSpacesByDisplayOrder<
  T extends { sortOrder: number; createdAt?: Date | string; title: string },
>(spaces: T[]): T[] {
  return [...spaces].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    if (a.createdAt && b.createdAt) {
      const at = new Date(a.createdAt).getTime();
      const bt = new Date(b.createdAt).getTime();
      if (at !== bt) return at - bt;
    }
    return a.title.localeCompare(b.title);
  });
}

/** New spaces append after existing unless slug is Start Here / Welcome (sort 0). */
export async function resolveSortOrderForNewSpace(slug: string): Promise<number> {
  if (isDefaultFirstSpaceSlug(slug)) return 0;

  const agg = await prisma.communitySpaceRecord.aggregate({
    _max: { sortOrder: true },
  });
  return (agg._max.sortOrder ?? -1) + 1;
}

export type CommunitySpaceOrderItem = {
  id: string;
  title: string;
  slug: string;
  status: string;
  sortOrder: number;
};
