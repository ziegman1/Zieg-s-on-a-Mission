"use server";

import { revalidatePath } from "next/cache";
import { signOut } from "@/auth";
import { signInCredentialsAndRedirect } from "@/lib/auth-sign-in";
import { safeCallbackUrl } from "@/lib/auth-callback";
import { canSignInWithCredentials } from "@/lib/auth-roles";
import { logMissionHubLogin } from "@/lib/community/auth-login-log";
import { createCommunityAccount } from "@/lib/community/account";
import { joinCommunitySchema, updateMemberProfileSchema } from "@/lib/community/member-form";
import {
  getCurrentCommunityMember,
  syncMemberVisitorKeyForUser,
  updateMemberProfileForUser,
} from "@/lib/community/members";
import { getOrSetVisitorKey } from "@/lib/community/visitor-key";
import { prismaForCredentialsAuth } from "@/lib/prisma-credentials";

export type CommunityAuthState = { error: string | null };

export async function joinCommunityAction(
  _prev: CommunityAuthState,
  formData: FormData,
): Promise<CommunityAuthState> {
  const raw = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    profileImageUrl: formData.get("profileImageUrl") ?? "",
  };

  const parsed = joinCommunitySchema.safeParse({
    firstName: typeof raw.firstName === "string" ? raw.firstName : "",
    lastName: typeof raw.lastName === "string" ? raw.lastName : "",
    email: typeof raw.email === "string" ? raw.email : "",
    password: typeof raw.password === "string" ? raw.password : "",
    profileImageUrl: typeof raw.profileImageUrl === "string" ? raw.profileImageUrl : "",
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.flatten().fieldErrors.email?.[0] ??
        parsed.error.flatten().fieldErrors.password?.[0] ??
        "Please check your details and try again.",
    };
  }

  const visitorKey = await getOrSetVisitorKey();

  try {
    await createCommunityAccount({
      ...parsed.data,
      visitorKey,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create account" };
  }

  const signInResult = await signInCredentialsAndRedirect({
    email: parsed.data.email.trim(),
    password: parsed.data.password,
    callbackUrl: safeCallbackUrl(formData.get("callbackUrl"), "/community"),
    role: "CUSTOMER",
    context: "community/join",
  });

  if (!signInResult.ok) {
    return { error: signInResult.error ?? "Account created but sign-in failed. Try signing in." };
  }

  return { error: null };
}

export async function communityLoginAction(
  _prev: CommunityAuthState,
  formData: FormData,
): Promise<CommunityAuthState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const callbackUrl = safeCallbackUrl(formData.get("callbackUrl"), "/community");

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "Email and password are required." };
  }

  const trimmedEmail = email.trim();
  const prisma = prismaForCredentialsAuth();
  const user = await prisma.user.findFirst({
    where: { email: { equals: trimmedEmail, mode: "insensitive" } },
    select: { id: true, role: true, passwordHash: true },
  });

  if (!user) {
    logMissionHubLogin({
      email: trimmedEmail,
      role: null,
      success: false,
      error: "user_not_found",
      callbackUrl,
      context: "community/login",
    });
    return {
      error:
        "No account found for this email. Owners can use the same form with admin credentials, or try Join Mission Hub for a member account.",
    };
  }

  if (!user.passwordHash) {
    logMissionHubLogin({
      email: trimmedEmail,
      role: user.role,
      success: false,
      error: "no_password_hash",
      callbackUrl,
      context: "community/login",
    });
    return {
      error:
        "This account has no password set. Contact support or use Owner sign in if you are an admin.",
    };
  }

  if (!canSignInWithCredentials(user.role)) {
    logMissionHubLogin({
      email: trimmedEmail,
      role: user.role,
      success: false,
      error: "role_not_allowed",
      callbackUrl,
      context: "community/login",
    });
    return { error: "This account cannot sign in to Mission Hub." };
  }

  const signInResult = await signInCredentialsAndRedirect({
    email: trimmedEmail,
    password,
    callbackUrl,
    role: user.role,
    context: "community/login",
  });

  if (!signInResult.ok) {
    return { error: signInResult.error };
  }

  if (user.role === "CUSTOMER") {
    const visitorKey = await getOrSetVisitorKey();
    await syncMemberVisitorKeyForUser(user.id, visitorKey).catch((err) =>
      console.error("[community/login] visitorKey sync:", err),
    );
  }

  return { error: null };
}

export async function communitySignOutAction(returnPath = "/community"): Promise<void> {
  const path = safeCallbackUrl(returnPath, "/community");
  await signOut({ redirectTo: path });
}

export async function updateMemberProfileAction(
  input: { firstName: string; lastName: string; profileImageUrl?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const member = await getCurrentCommunityMember();
  if (!member?.userId) {
    return { ok: false, error: "Sign in to update your profile." };
  }

  const parsed = updateMemberProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid profile details" };
  }

  try {
    await updateMemberProfileForUser(member.userId, parsed.data);
    revalidatePath("/community");
    revalidatePath("/community/profile");
    revalidatePath("/community/settings");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save profile" };
  }
}

/** Ensure legacy visitor profile can be upgraded (link user on join only at create). */
export async function linkVisitorMemberToUserIfNeeded(
  userId: string,
  visitorKey: string,
): Promise<void> {
  const prisma = prismaForCredentialsAuth();
  const byVisitor = await prisma.communityMemberRecord.findUnique({
    where: { visitorKey },
  });
  if (byVisitor && !byVisitor.userId) {
    await prisma.communityMemberRecord.update({
      where: { id: byVisitor.id },
      data: { userId },
    });
  }
}
