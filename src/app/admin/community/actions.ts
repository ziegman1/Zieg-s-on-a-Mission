"use server";

import { revalidatePath } from "next/cache";
import { slugifyCommunityTitle } from "@/lib/community/slug";
import {
  communitySpaceInputSchema,
  spaceFormDataFromInput,
  type CommunitySpaceFormInput,
} from "@/lib/community/space-form";
import { createCommunitySpaceCore, type CreateCommunitySpaceResult } from "@/lib/community/create-community-space-core";
import { buildCompactSpaceCreatePayload } from "@/lib/community/compact-space-create-payload";
import { requireCommunityOwner } from "@/lib/community/owner";
import { normalizeSpaceTypeRaw } from "@/lib/community/space-interaction";
import { parseSpaceType } from "@/lib/community/space-experience";
import { mergeSpaceSettingsWithNotificationCategory } from "@/lib/community/space-notification-category";
import { formatCommunitySpaceInputErrors } from "@/lib/community/space-form-errors";
import { isReservedCommunitySpaceSlug } from "@/lib/community/reserved-space-slugs";
import { prisma } from "@/lib/db";

export type { CreateCommunitySpaceResult };

export async function createCommunitySpaceAction(
  input: CommunitySpaceFormInput,
): Promise<CreateCommunitySpaceResult> {
  return createCommunitySpaceCore(input, { source: "admin/actions" });
}

export async function ensureBlogArticlesSpaceAction(): Promise<CreateCommunitySpaceResult> {
  return createCommunitySpaceCore(
    buildCompactSpaceCreatePayload({ title: "Blog Articles", icon: "blog" }),
    { source: "admin/ensure-blog-articles" },
  );
}

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
