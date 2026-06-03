import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { slugifyCommunityTitle } from "@/lib/community/slug";
import {
  communitySpaceInputSchema,
  spaceFormDataFromInput,
  type CommunitySpaceFormInput,
} from "@/lib/community/space-form";
import { formatCommunitySpaceInputErrors } from "@/lib/community/space-form-errors";
import { requireCommunityOwner } from "@/lib/community/owner";
import { normalizeSpaceTypeRaw } from "@/lib/community/space-interaction";
import { parseSpaceType } from "@/lib/community/space-experience";
import { resolveSortOrderForNewSpace } from "@/lib/community/space-order";
import { mergeSpaceSettingsWithNotificationCategory } from "@/lib/community/space-notification-category";
import { isReservedCommunitySpaceSlug } from "@/lib/community/reserved-space-slugs";
import { prisma } from "@/lib/db";

export type CreateCommunitySpaceResult =
  | { ok: true; id: string; slug: string; title: string; existing?: boolean; requestId: string }
  | { ok: false; error: string; existingSlug?: string; requestId: string };

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

function safePayloadLog(input: CommunitySpaceFormInput) {
  return {
    title: input.title,
    slug: input.slug,
    status: input.status,
    icon: input.icon,
    spaceType: input.spaceType,
    notificationCategory: input.notificationCategory,
    hasCover: Boolean(input.coverImageUrl?.trim()),
  };
}

export async function createCommunitySpaceCore(
  input: CommunitySpaceFormInput,
  opts?: { source?: string },
): Promise<CreateCommunitySpaceResult> {
  const requestId = randomUUID().slice(0, 8);
  const source = opts?.source ?? "unknown";

  console.log("[createCommunitySpace]", {
    phase: "reached",
    requestId,
    source,
    build: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? process.env.NEXT_PUBLIC_MISSION_HUB_BUILD_SHA ?? "unknown",
  });

  const owner = await requireCommunityOwner();
  if (!owner) {
    console.warn("[createCommunitySpace]", {
      phase: "unauthorized",
      requestId,
      source,
    });
    return {
      ok: false,
      error: `Unauthorized — sign in as an admin on Mission Hub and try again. (ref ${requestId})`,
      requestId,
    };
  }

  console.log("[createCommunitySpace]", {
    phase: "authenticated",
    requestId,
    source,
    userId: owner.id,
    email: owner.email,
    role: owner.role,
    payload: safePayloadLog(input),
  });

  const parsed = communitySpaceInputSchema.safeParse(input);
  if (!parsed.success) {
    const error = formatCommunitySpaceInputErrors(parsed.error);
    console.warn("[createCommunitySpace]", {
      phase: "validation_failed",
      requestId,
      source,
      error,
      issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
    return { ok: false, error: `${error} (ref ${requestId})`, requestId };
  }

  const data = parsed.data;
  const slug = data.slug || slugifyCommunityTitle(data.title);
  if (!slug) {
    return { ok: false, error: `Slug is required (ref ${requestId})`, requestId };
  }
  if (isReservedCommunitySpaceSlug(slug)) {
    return {
      ok: false,
      error: `That slug is reserved for Mission Hub navigation. Choose a different name. (ref ${requestId})`,
      requestId,
    };
  }

  const formPayload = {
    ...data,
    spaceType: parseSpaceType(normalizeSpaceTypeRaw(data.spaceType), slug),
  };

  console.log("[createCommunitySpace]", {
    phase: "validated",
    requestId,
    source,
    slug,
    status: formPayload.status,
    notificationCategory: formPayload.notificationCategory,
  });

  try {
    const sortOrder = await resolveSortOrderForNewSpace(slug);
    console.log("[createCommunitySpace]", {
      phase: "prisma_create_start",
      requestId,
      source,
      slug,
      sortOrder,
    });

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
    console.log("[createCommunitySpace]", {
      phase: "prisma_create_success",
      requestId,
      source,
      id: row.id,
      slug: row.slug,
      title: row.title,
      status: row.status,
    });
    return { ok: true, id: row.id, slug: row.slug, title: row.title, requestId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not create space";
    const code =
      e && typeof e === "object" && "code" in e
        ? String((e as { code?: unknown }).code)
        : undefined;

    console.error("[createCommunitySpace]", {
      phase: "prisma_create_error",
      requestId,
      source,
      slug,
      message: msg,
      code,
    });

    if (msg.includes("Unique constraint") || msg.includes("community_spaces_slug")) {
      const existing = await prisma.communitySpaceRecord.findUnique({ where: { slug } });
      if (existing?.status === "published") {
        revalidateCommunity(existing.slug);
        return {
          ok: true,
          id: existing.id,
          slug: existing.slug,
          title: existing.title,
          existing: true,
          requestId,
        };
      }
      if (existing) {
        return {
          ok: false,
          error: `A space named "${existing.title}" already exists (${existing.status}). Open Admin → Community to manage it. (ref ${requestId})`,
          existingSlug: existing.slug,
          requestId,
        };
      }
      return { ok: false, error: `That slug is already in use. (ref ${requestId})`, requestId };
    }

    return { ok: false, error: `Could not create space: ${msg} (ref ${requestId})`, requestId };
  }
}
