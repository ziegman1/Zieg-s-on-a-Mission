import { redirect } from "next/navigation";
import { AuthError, CredentialsSignin } from "next-auth";
import { signIn } from "@/auth";
import { logMissionHubLogin } from "@/lib/community/auth-login-log";

function isNextRedirectError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("digest" in error)) return false;
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

export type CredentialsSignInOutcome =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Credentials sign-in from a server action, then navigate to callbackUrl.
 * Uses `redirect: false` so Auth.js v5 does not swallow the post-login redirect.
 */
export async function signInCredentialsAndRedirect(input: {
  email: string;
  password: string;
  callbackUrl: string;
  role?: string | null;
  context?: string;
}): Promise<CredentialsSignInOutcome> {
  const email = input.email.trim();

  try {
    const result = await signIn("credentials", {
      email,
      password: input.password,
      redirect: false,
    });

    const signInError =
      result && typeof result === "object" && "error" in result
        ? (result as { error?: string | null }).error
        : null;

    if (signInError) {
      logMissionHubLogin({
        email,
        role: input.role,
        success: false,
        error: signInError,
        callbackUrl: input.callbackUrl,
        context: input.context,
      });
      if (
        signInError === "CredentialsSignin" ||
        signInError.toLowerCase().includes("credential")
      ) {
        return { ok: false, error: "Invalid email or password." };
      }
      return { ok: false, error: "Sign in failed. Try again." };
    }

    logMissionHubLogin({
      email,
      role: input.role,
      success: true,
      callbackUrl: input.callbackUrl,
      context: input.context,
    });
    redirect(input.callbackUrl);
  } catch (error) {
    if (isNextRedirectError(error)) throw error;

    const message =
      error instanceof Error ? error.message : "Something went wrong.";

    logMissionHubLogin({
      email,
      role: input.role,
      success: false,
      error: message,
      callbackUrl: input.callbackUrl,
      context: input.context,
    });

    if (error instanceof CredentialsSignin) {
      return { ok: false, error: "Invalid email or password." };
    }
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { ok: false, error: "Invalid email or password." };
      }
      return { ok: false, error: "Sign in failed. Try again." };
    }

    console.error(`[${input.context ?? "auth"} sign-in]`, error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  return { ok: true };
}
