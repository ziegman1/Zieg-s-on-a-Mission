"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { signIn } from "@/auth";

export type LoginState = { error: string | null };

/** Successful `signIn` calls `redirect()`, which throws this in the App Router. */
function isNextRedirectError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("digest" in error)) return false;
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

function safeCallbackUrl(raw: unknown): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/admin";
  }
  return raw;
}

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

  try {
    await signIn("credentials", {
      email: email.trim(),
      password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    if (error instanceof CredentialsSignin) {
      return { error: "Invalid email or password." };
    }
    if (error instanceof AuthError) {
      return { error: "Sign in failed. Try again." };
    }
    console.error("[admin login]", error);
    return { error: "Something went wrong." };
  }

  return { error: null };
}
