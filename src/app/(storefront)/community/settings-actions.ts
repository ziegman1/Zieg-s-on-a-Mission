"use server";

import { compare, hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { isAdminRole } from "@/lib/admin-users";
import { upsertCommunityHubSettings } from "@/lib/community/hub-settings";
import {
  getCurrentCommunityMember,
  updateMemberProfileForUser,
  updateOwnerUserProfile,
} from "@/lib/community/members";
import { getCurrentCommunityOwner } from "@/lib/community/owner";
import {
  changePasswordSchema,
  communitySpaceSettingsSchema,
  mergeSpaceSettings,
  updateHubSettingsSchema,
  updateNotificationPrefsSchema,
  updateProfileSettingsSchema,
  type NotificationPreferences,
} from "@/lib/community/settings-types";
import { voicePrayerSettingsPatch } from "@/lib/community/voice-prayer";
import { revalidateCommunityFeeds } from "@/lib/community/post-author";
import { normalizeSpaceTypeRaw } from "@/lib/community/space-interaction";
import { parseSpaceType } from "@/lib/community/space-experience";
import { updateUserNotificationPreferences } from "@/lib/community/user-notification-prefs";
import { prisma } from "@/lib/db";
import { prismaForCredentialsAuth } from "@/lib/prisma-credentials";

async function requireSettingsUser(): Promise<
  { ok: true; userId: string; isAdmin: boolean } | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Sign in required" };
  }
  const isAdmin = isAdminRole(session.user.role);
  const member = await getCurrentCommunityMember();
  if (!member && !isAdmin) {
    return { ok: false, error: "Mission Hub access required" };
  }
  return { ok: true, userId: session.user.id, isAdmin };
}

async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const owner = await getCurrentCommunityOwner();
  if (!owner) return { ok: false, error: "Admin access required" };
  return { ok: true, userId: owner.id };
}

/** Server-only — revalidate Mission Hub routes after space order or settings change. */
function revalidateCommunitySpaceOrder(...slugs: (string | undefined)[]): void {
  revalidatePath("/community", "layout");
  revalidatePath("/community/spaces");
  revalidatePath("/community/settings");
  revalidatePath("/admin/community");
  for (const slug of slugs) {
    if (slug) revalidatePath(`/community/${slug}`);
  }
}

function revalidateSettings() {
  revalidateCommunityFeeds();
  revalidatePath("/community/settings");
  revalidatePath("/community/profile");
}

export async function saveProfileSettingsAction(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const authResult = await requireSettingsUser();
  if (!authResult.ok) return authResult;

  const parsed = updateProfileSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid profile details" };
  }

  const owner = await getCurrentCommunityOwner();
  const data = parsed.data;

  try {
    if (owner) {
      const displayName =
        data.ownerName?.trim() ||
        owner.name?.trim() ||
        owner.email?.split("@")[0] ||
        "Mission Hub";
      await updateOwnerUserProfile(authResult.userId, {
        name: displayName,
        image:
          data.profileImageUrl !== undefined
            ? data.profileImageUrl.trim() || null
            : undefined,
      });
    }

    const member = await getCurrentCommunityMember();
    if (member?.userId && (data.firstName || data.lastName)) {
      await updateMemberProfileForUser(member.userId, {
        firstName: data.firstName ?? member.firstName,
        lastName: data.lastName ?? member.lastName,
        displayName: data.displayName,
        bio: data.bio,
        profileImageUrl: data.profileImageUrl,
      });
    } else if (member?.userId) {
      await updateMemberProfileForUser(member.userId, {
        firstName: member.firstName,
        lastName: member.lastName,
        displayName: data.displayName,
        bio: data.bio,
        profileImageUrl: data.profileImageUrl,
      });
    }

    revalidateSettings();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save profile" };
  }
}

export async function saveNotificationPrefsAction(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const authResult = await requireSettingsUser();
  if (!authResult.ok) return authResult;

  const parsed = updateNotificationPrefsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid notification settings" };
  }

  try {
    await updateUserNotificationPreferences(
      authResult.userId,
      parsed.data as NotificationPreferences,
    );
    revalidateSettings();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save" };
  }
}

export async function changePasswordAction(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const authResult = await requireSettingsUser();
  if (!authResult.ok) return authResult;

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors.confirmPassword?.[0];
    return { ok: false, error: msg ?? "Invalid password" };
  }

  const prismaAuth = prismaForCredentialsAuth();
  const user = await prismaAuth.user.findUnique({
    where: { id: authResult.userId },
    select: { passwordHash: true },
  });
  if (!user?.passwordHash) {
    return { ok: false, error: "Password sign-in is not set up for this account." };
  }

  const valid = await compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return { ok: false, error: "Current password is incorrect" };
  }

  const passwordHash = await hash(parsed.data.newPassword, 10);
  await prismaAuth.user.update({
    where: { id: authResult.userId },
    data: { passwordHash },
  });

  return { ok: true };
}

export async function saveHubSettingsAction(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdmin();
  if (!admin.ok) return admin;

  const parsed = updateHubSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid hub settings" };
  }

  try {
    await upsertCommunityHubSettings(parsed.data);
    revalidateSettings();
    return { ok: true };
  } catch (e) {
    console.error(e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not save. Run database migration.",
    };
  }
}

export async function saveSpaceSettingsAction(
  spaceId: string,
  input: {
    title?: string;
    description?: string;
    icon?: string;
    status?: string;
    sortOrder?: number;
    featured?: boolean;
    coverImageUrl?: string;
    spaceType?: string;
    themeMood?: string | null;
    welcomeMessage?: string | null;
    engagementPrompt?: string | null;
    allowComments?: boolean;
    allowReactions?: boolean;
    allowMemberPosts?: boolean;
    requirePostApproval?: boolean;
    allowVoiceMessages?: boolean;
    showWelcomeMessage?: boolean;
    pinWelcomeMessage?: boolean;
    settings?: unknown;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdmin();
  if (!admin.ok) return admin;

  if (!spaceId?.trim()) return { ok: false, error: "Invalid space" };

  const settingsParsed = input.settings
    ? communitySpaceSettingsSchema.safeParse(input.settings)
    : { success: true as const, data: undefined };

  if (!settingsParsed.success) {
    return { ok: false, error: "Invalid space configuration" };
  }

  try {
    const existing = await prisma.communitySpaceRecord.findUnique({
      where: { id: spaceId },
    });
    if (!existing) return { ok: false, error: "Space not found" };

    const allowVoiceMessages =
      input.allowVoiceMessages !== undefined
        ? input.allowVoiceMessages
        : existing.allowVoiceMessages;

    const mergedSettings = {
      ...mergeSpaceSettings(existing.settings),
      ...(settingsParsed.data ?? {}),
      ...voicePrayerSettingsPatch(allowVoiceMessages),
    };

    await prisma.communitySpaceRecord.update({
      where: { id: spaceId },
      data: {
        title: input.title?.trim() ?? undefined,
        description:
          input.description !== undefined ? input.description.trim() || null : undefined,
        icon: input.icon ?? undefined,
        status: input.status ?? undefined,
        sortOrder: input.sortOrder ?? undefined,
        featured: input.featured ?? undefined,
        coverImageUrl:
          input.coverImageUrl !== undefined
            ? input.coverImageUrl.trim() || null
            : undefined,
        spaceType:
          input.spaceType !== undefined
            ? parseSpaceType(
                normalizeSpaceTypeRaw(input.spaceType),
                existing.slug,
              )
            : undefined,
        themeMood:
          input.themeMood !== undefined ? input.themeMood?.trim() || null : undefined,
        welcomeMessage:
          input.welcomeMessage !== undefined
            ? (input.welcomeMessage ?? "").trim() || null
            : undefined,
        engagementPrompt:
          input.engagementPrompt !== undefined
            ? (input.engagementPrompt ?? "").trim() || null
            : undefined,
        allowComments: input.allowComments ?? undefined,
        allowReactions: input.allowReactions ?? undefined,
        allowMemberPosts: input.allowMemberPosts ?? undefined,
        requirePostApproval: input.requirePostApproval ?? undefined,
        allowVoiceMessages,
        showWelcomeMessage: input.showWelcomeMessage ?? undefined,
        pinWelcomeMessage: input.pinWelcomeMessage ?? undefined,
        settings: mergedSettings,
      },
    });

    revalidateCommunityFeeds();
    revalidateCommunitySpaceOrder(existing.slug);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Could not save space" };
  }
}

/** Persist display order for Mission Hub space lists (sidebar, pills, spaces page, composer). */
export async function reorderCommunitySpacesAction(
  orderedIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdmin();
  if (!admin.ok) return admin;

  const ids = orderedIds.filter((id) => typeof id === "string" && id.trim());
  if (ids.length === 0) {
    return { ok: false, error: "No spaces to reorder" };
  }

  try {
    const rows = await prisma.communitySpaceRecord.findMany({
      where: { id: { in: ids } },
      select: { id: true, slug: true },
    });
    if (rows.length !== ids.length) {
      return { ok: false, error: "One or more spaces were not found" };
    }

    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.communitySpaceRecord.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    revalidateCommunityFeeds();
    revalidateCommunitySpaceOrder(...rows.map((r) => r.slug));
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, error: e instanceof Error ? e.message : "Could not save order" };
  }
}
