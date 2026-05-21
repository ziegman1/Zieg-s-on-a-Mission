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
import { prisma } from "@/lib/db";

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
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const owner = await requireCommunityOwner();
  if (!owner) return { ok: false, error: "Unauthorized" };

  const parsed = communitySpaceInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.flatten().formErrors.join(", ") || "Invalid input" };
  }

  const data = parsed.data;
  const slug = data.slug || slugifyCommunityTitle(data.title);
  if (!slug) return { ok: false, error: "Slug is required" };

  const formPayload = {
    ...data,
    spaceType: parseSpaceType(normalizeSpaceTypeRaw(data.spaceType), slug),
  };

  try {
    const sortOrder = await resolveSortOrderForNewSpace(slug);
    const row = await prisma.communitySpaceRecord.create({
      data: {
        ...spaceFormDataFromInput(formPayload),
        slug,
        sortOrder,
      },
    });
    revalidateCommunity(row.slug);
    return { ok: true, id: row.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not create space";
    if (msg.includes("Unique constraint") || msg.includes("community_spaces_slug")) {
      return { ok: false, error: "That slug is already in use." };
    }
    console.error(e);
    return { ok: false, error: "Could not create space. Is the database migrated?" };
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
    return { ok: false, error: parsed.error.flatten().formErrors.join(", ") || "Invalid input" };
  }

  const data = parsed.data;
  const slug = data.slug || slugifyCommunityTitle(data.title);
  if (!slug) return { ok: false, error: "Slug is required" };

  const formPayload = {
    ...data,
    spaceType: parseSpaceType(normalizeSpaceTypeRaw(data.spaceType), slug),
  };

  try {
    const existing = await prisma.communitySpaceRecord.findUnique({ where: { id } });
    await prisma.communitySpaceRecord.update({
      where: { id },
      data: {
        ...spaceFormDataFromInput(formPayload),
        slug,
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
