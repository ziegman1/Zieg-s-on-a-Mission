"use server";

import { revalidatePath } from "next/cache";
import { slugifyCommunityTitle } from "@/lib/community/slug";
import {
  communitySpaceInputSchema,
  spaceFormDataFromInput,
  type CommunitySpaceFormInput,
} from "@/lib/community/space-form";
import { requireCommunityOwner } from "@/lib/community/owner";
import { normalizeSpaceTypeRaw } from "@/lib/community/space-interaction";
import { parseSpaceType } from "@/lib/community/space-experience";
import { resolveSortOrderForNewSpace } from "@/lib/community/space-order";
import { mergeSpaceSettingsWithNotificationCategory } from "@/lib/community/space-notification-category";
import { formatCommunitySpaceInputErrors } from "@/lib/community/space-form-errors";
import { isReservedCommunitySpaceSlug } from "@/lib/community/reserved-space-slugs";
import { prisma } from "@/lib/db";

export type CreateCommunitySpaceResult =
  | { ok: true; id: string; slug: string; title: string; existing?: boolean }
  | { ok: false; error: string; existingSlug?: string };

function revalidateCommunitySpaceOrder(...slugs: (string | undefined)[]): void {
  revalidatePath("/community", "layout");
  revalidatePath("/community/spaces");
  revalidatePath("/community/settings");
  revalidatePath("/admin/community");
  for (const slug of slugs) {
    if (slug) revalidatePath(`/community/${slug}`);
  }
}

function revalidateCommunity(...slugs: (string | undefined)[]) {
  revalidateCommunitySpaceOrder(...slugs);
  revalidatePath("/admin/community/posts");
}

export async function createCommunitySpaceAction(
  input: CommunitySpaceFormInput,
): Promise<CreateCommunitySpaceResult> {
  const owner = await requireCommunityOwner();
  if (!owner) {
    console.warn("[createCommunitySpaceAction] unauthorized");
    return { ok: false, error: "Unauthorized — sign in as an admin and try again." };
  }

  const parsed = communitySpaceInputSchema.safeParse(input);
  if (!parsed.success) {
    const error = formatCommunitySpaceInputErrors(parsed.error);
    console.warn("[createCommunitySpaceAction] validation failed:", error);
    return { ok: false, error };
  }

  const data = parsed.data;
  const slug = data.slug || slugifyCommunityTitle(data.title);
  if (!slug) return { ok: false, error: "Slug is required" };
  if (isReservedCommunitySpaceSlug(slug)) {
    return {
      ok: false,
      error: "That slug is reserved for Mission Hub navigation. Choose a different name.",
    };
  }

  const formPayload = {
    ...data,
    spaceType: parseSpaceType(normalizeSpaceTypeRaw(data.spaceType), slug),
  };

  if (process.env.NODE_ENV !== "production") {
    console.log("[createCommunitySpaceAction] creating", {
      title: formPayload.title,
      slug,
      status: formPayload.status,
      notificationCategory: formPayload.notificationCategory,
    });
  }

  try {
    const sortOrder = await resolveSortOrderForNewSpace(slug);
    const row = await prisma.communitySpaceRecord.create({
      data: {
        ...spaceFormDataFromInput(formPayload),
        slug,
        sortOrder,
        settings: mergeSpaceSettingsWithNotificationCategory(
          {},
          formPayload.notificationCategory,
        ),
      },
    });
    revalidateCommunity(row.slug);
    console.log("[createCommunitySpaceAction] created", {
      id: row.id,
      slug: row.slug,
      status: row.status,
    });
    return { ok: true, id: row.id, slug: row.slug, title: row.title };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not create space";
    if (msg.includes("Unique constraint") || msg.includes("community_spaces_slug")) {
      const existing = await prisma.communitySpaceRecord.findUnique({ where: { slug } });
      if (existing?.status === "published") {
        console.warn("[createCommunitySpaceAction] slug exists (published)", { slug });
        revalidateCommunity(existing.slug);
        return {
          ok: true,
          id: existing.id,
          slug: existing.slug,
          title: existing.title,
          existing: true,
        };
      }
      if (existing) {
        return {
          ok: false,
          error: `A space named "${existing.title}" already exists (${existing.status}). Open Admin → Community to manage it, or choose a different name.`,
          existingSlug: existing.slug,
        };
      }
      return { ok: false, error: "That slug is already in use." };
    }
    console.error("[createCommunitySpaceAction] prisma error:", e);
    return { ok: false, error: `Could not create space: ${msg}` };
  }
}

export async function updateCommunitySpaceAction(
  id: string,
  input: CommunitySpaceFormInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const owner = await requireCommunityOwner();
  if (!owner) return { ok: false, error: "Unauthorized" };

  const parsed = communitySpaceInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: formatCommunitySpaceInputErrors(parsed.error),
    };
  }

  const data = parsed.data;
  const slug = data.slug || slugifyCommunityTitle(data.title);
  if (!slug) return { ok: false, error: "Slug is required" };
  if (isReservedCommunitySpaceSlug(slug)) {
    return {
      ok: false,
      error: "That slug is reserved for Mission Hub navigation. Choose a different name.",
    };
  }

  const formPayload = {
    ...data,
    spaceType: parseSpaceType(normalizeSpaceTypeRaw(data.spaceType), slug),
  };

  try {
    const existing = await prisma.communitySpaceRecord.findUnique({ where: { id } });
    if (!existing) return { ok: false, error: "Space not found" };
    await prisma.communitySpaceRecord.update({
      where: { id },
      data: {
        ...spaceFormDataFromInput(formPayload),
        slug,
        settings: mergeSpaceSettingsWithNotificationCategory(
          existing.settings,
          formPayload.notificationCategory,
        ),
      },
    });
    revalidateCommunity(existing?.slug, slug);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not update space";
    if (msg.includes("Unique constraint") || msg.includes("community_spaces_slug")) {
      return { ok: false, error: "That slug is already in use." };
    }
    console.error(e);
    return { ok: false, error: "Could not update space." };
  }
}

export async function archiveCommunitySpaceAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const owner = await requireCommunityOwner();
  if (!owner) return { ok: false, error: "Unauthorized" };

  try {
    const existing = await prisma.communitySpaceRecord.findUnique({ where: { id } });
    await prisma.communitySpaceRecord.update({
      where: { id },
      data: { status: "archived" },
    });
    revalidateCommunity(existing?.slug);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Could not archive space." };
  }
}
