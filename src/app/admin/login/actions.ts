"use server";

import { signInCredentialsAndRedirect } from "@/lib/auth-sign-in";
import { safeCallbackUrl } from "@/lib/auth-callback";
import { getAuthConfigIssues } from "@/lib/auth-env";
import { isAdminRole } from "@/lib/admin-users";
import { logMissionHubLogin } from "@/lib/community/auth-login-log";
import { prismaForCredentialsAuth } from "@/lib/prisma-credentials";
import type { UserRole } from "@prisma/client";

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

  const configIssues = getAuthConfigIssues();
  if (configIssues.length > 0) {
    return {
      error:
        "Sign-in is not configured on the server. Check AUTH_SECRET and DATABASE_URL in Vercel, then redeploy.",
    };
  }

  const trimmedEmail = email.trim();
  let user: { role: UserRole; passwordHash: string | null } | null = null;
  try {
    const prisma = prismaForCredentialsAuth();
    user = await prisma.user.findFirst({
      where: { email: { equals: trimmedEmail, mode: "insensitive" } },
      select: { role: true, passwordHash: true },
    });
  } catch (e) {
    console.error("[admin/login] database lookup failed:", e);
    return {
      error:
        "Could not reach the database. Verify DATABASE_URL on Vercel (Supabase pooler :6543 with ?pgbouncer=true), then try again.",
    };
  }

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
