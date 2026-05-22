import type { Session } from "next-auth";
import { auth } from "@/auth";
import { getAuthConfigIssues } from "@/lib/auth-env";

export type SafeAuthResult =
  | { ok: true; session: Session | null }
  | { ok: false; session: null; configIssues: ReturnType<typeof getAuthConfigIssues> }
  | { ok: false; session: null; error: string };

/** Read session without crashing the page when auth env or JWT decoding fails. */
export async function safeAuth(): Promise<SafeAuthResult> {
  const configIssues = getAuthConfigIssues();
  if (configIssues.length > 0) {
    return { ok: false, session: null, configIssues };
  }

  try {
    const session = await auth();
    return { ok: true, session };
  } catch (e) {
    console.error("[safeAuth] auth() failed:", e);
    return {
      ok: false,
      session: null,
      error:
        e instanceof Error ? e.message : "Could not read sign-in session.",
    };
  }
}
