"use server";

import { signInCredentialsAndRedirect } from "@/lib/auth-sign-in";
import { safeCallbackUrl } from "@/lib/auth-callback";
import { isAdminRole } from "@/lib/admin-users";
import { logMissionHubLogin } from "@/lib/community/auth-login-log";
import { prismaForCredentialsAuth } from "@/lib/prisma-credentials";

export type LoginState = { error: string | null };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const callbackUrl = safeCallbackUrl(formData.get("callbackUrl"));

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "Email and password are required." };
  }

  const trimmedEmail = email.trim();
  const prisma = prismaForCredentialsAuth();
  const user = await prisma.user.findFirst({
    where: { email: { equals: trimmedEmail, mode: "insensitive" } },
    select: { role: true, passwordHash: true },
  });

  if (!user) {
    logMissionHubLogin({
      email: trimmedEmail,
      role: null,
      success: false,
      error: "user_not_found",
      callbackUrl,
      context: "admin/login",
    });
    return { error: "Invalid email or password." };
  }

  if (!isAdminRole(user.role)) {
    logMissionHubLogin({
      email: trimmedEmail,
      role: user.role,
      success: false,
      error: "not_admin_role",
      callbackUrl,
      context: "admin/login",
    });
    return {
      error:
        "Admin sign in is for owners only. Use Mission Hub sign in at /community/login for member accounts.",
    };
  }

  if (!user.passwordHash) {
    logMissionHubLogin({
      email: trimmedEmail,
      role: user.role,
      success: false,
      error: "no_password_hash",
      callbackUrl,
      context: "admin/login",
    });
    return {
      error:
        "This admin account has no password set. Set ADMIN_PASSWORD (or ADMIN_PASSWORD_LINDSAY) and run db:seed:admin.",
    };
  }

  const signInResult = await signInCredentialsAndRedirect({
    email: trimmedEmail,
    password,
    callbackUrl,
    role: user.role,
    context: "admin/login",
  });

  if (!signInResult.ok) {
    return { error: signInResult.error };
  }

  return { error: null };
}
