"use server";

import { signOut } from "@/auth";
import { safeCallbackUrl } from "@/lib/auth-callback";

export async function communityOwnerSignOutAction(returnPath: string): Promise<void> {
  await signOut({
    redirectTo: safeCallbackUrl(returnPath, "/community"),
  });
}
