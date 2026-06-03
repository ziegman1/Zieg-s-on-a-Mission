import { prisma } from "@/lib/db";

/** Lightweight fingerprint for published space list changes (create, publish, reorder). */
export async function getPublishedSpacesFingerprint(): Promise<string> {
  try {
    const [count, latest] = await Promise.all([
      prisma.communitySpaceRecord.count({ where: { status: "published" } }),
      prisma.communitySpaceRecord.findFirst({
        where: { status: "published" },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        select: { id: true, updatedAt: true },
      }),
    ]);

    const updatedAt = latest?.updatedAt?.toISOString() ?? "";
    return `${count}:${latest?.id ?? ""}:${updatedAt}`;
  } catch (e) {
    console.error("[community spaces] getPublishedSpacesFingerprint failed:", e);
    return "0::";
  }
}
