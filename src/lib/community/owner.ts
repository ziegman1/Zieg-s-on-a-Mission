import { auth } from "@/auth";
import { isAdminRole } from "@/lib/admin-users";
import type { CommunityOwner } from "@/lib/community/owner-types";

export type { CommunityOwner } from "@/lib/community/owner-types";

export async function getCurrentCommunityOwner(): Promise<CommunityOwner | null> {
  const session = await auth();
  if (!session?.user?.id || !isAdminRole(session.user.role)) {
    return null;
  }
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    name: session.user.name ?? null,
    role: session.user.role,
  };
}

export async function isCommunityOwner(): Promise<boolean> {
  return (await getCurrentCommunityOwner()) !== null;
}

/** Returns owner session or null — use in server actions before mutating community data. */
export async function requireCommunityOwner(): Promise<CommunityOwner | null> {
  return getCurrentCommunityOwner();
}
